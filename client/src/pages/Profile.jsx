import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { User, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updatePost, deletePost } from "../services/postService";
import Navbar from "../components/Navbar";
import FollowButton from "../components/FollowButton";
import PostVoteControls from "../components/PostVoteControls";
import { Editor } from "@tinymce/tinymce-react";
import { authFetch } from "../services/api";

const POSTS_LIMIT = 5;

const buildProfilePostsUrl = ({ username, cursor = null, sortBy, sortDir }) => {
  const params = new URLSearchParams({
    limit: String(POSTS_LIMIT),
    sortBy,
    sortDir,
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return `/api/posts/user/${encodeURIComponent(username)}?${params.toString()}`;
};

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const editEditorRef = useRef(null);
  const [user, setUser] = useState(null);
  const isOwnProfile = user && (!username || username === user.username);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [errors, setErrors] = useState({});

  const [profileUser, setProfileUser] = useState(null);
  const targetUserId = profileUser?.id;

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editorLoaded, setEditorLoaded] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [editFormData, setEditFormData] = useState("");

  const [posts, setPosts] = useState([]);
  const [postsCursor, setPostsCursor] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const profileUsername = username || user?.username || null;

  // Load current user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken) {
      navigate("/login");
    } else {
      const loggedUser = JSON.parse(storedUser);
      setUser(loggedUser);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    if (!username) {
      setProfileUser(user);
      return;
    }

    const fetchProfileUser = async () => {
      const res = await authFetch(`/api/users/${username}`);
      const data = await res.json();
      setProfileUser(data);
    };

    fetchProfileUser();
  }, [username, user]);

  // Fetch followers/following counts
  useEffect(() => {
    if (!targetUserId) return;

    const fetchFollowCounts = async () => {
      const res = await authFetch(`/api/follow/follow-count/${targetUserId}`);
      const data = await res.json();
      setFollowersCount(data.followers);
      setFollowingCount(data.following);
    };

    fetchFollowCounts();
  }, [targetUserId]);

  useEffect(() => {
    if (!profileUsername) return;

    const fetchInitialPosts = async () => {
      setLoadingPosts(true);

      try {
        const res = await authFetch(
          buildProfilePostsUrl({
            username: profileUsername,
            sortBy,
            sortDir,
          })
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("Server error:", text);
          return;
        }

        const data = await res.json();
        setPosts(data.posts ?? []);
        setPostsCursor(data.nextCursor ?? null);
        setHasMorePosts(Boolean(data.hasMore));
        setTotalPostsCount(Number(data.totalPosts ?? 0));
      } catch (err) {
        console.error("Failed to load profile posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    setPosts([]);
    setPostsCursor(null);
    setHasMorePosts(true);
    fetchInitialPosts();
  }, [profileUsername, sortBy, sortDir]);

  // Mark posts as seen when visiting profile
  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) return;

    authFetch("/api/follow/seen", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        followerId: user.id,
        followingId: targetUserId
      })
    }).catch(err => console.error("Failed to mark as seen:", err));

  }, [user, targetUserId, isOwnProfile]);

  useEffect(() => {
    if (showEditProfile && user) {
      setEditFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || ""
      });

      setErrors({});
    }
  }, [showEditProfile, user]);

  const refetchFollowCounts = async () => {
    if (!targetUserId) return;

    const res = await authFetch(`/api/follow/follow-count/${targetUserId}`);
    const data = await res.json();
    setFollowersCount(data.followers);
    setFollowingCount(data.following);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let avatarUrl = user.avatar;

      if (selectedImage) {
        const formData = new FormData();
        formData.append("avatar", selectedImage);
        formData.append("userId", user.id);

        const uploadRes = await authFetch("/api/users/upload-avatar", {
          method: "POST",
          body: formData
        });

        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.avatar;
      }

      const res = await authFetch("/api/users/update-profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          ...editFormData,
          avatar: avatarUrl
        }),
      });

      const updatedUser = await res.json();

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileUser(updatedUser);
      navigate(`/profile/${updatedUser.username}`);

      toast.success("Profile updated successfully!");
      setShowEditProfile(false);

    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editFormData.fullname.trim()) {
      newErrors.fullname = "Fullname is required";
    }

    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(editFormData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!editFormData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (editFormData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (editFormData.bio.length > 150) {
      newErrors.bio = "Bio must be less than 150 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      await deletePost(deletePostId);

      toast.success("Post deleted successfully!");

      setPosts(prev => prev.filter(p => p.id !== deletePostId));
      setTotalPostsCount((prev) => Math.max(prev - 1, 0));

      setShowDeleteDialog(false);
      setDeletePostId(null);

    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handlePostVoteChange = ({ postId, voteCount, currentUserVote }) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              vote_count: voteCount,
              current_user_vote: currentUserVote,
            }
          : post
      )
    );
  };

  const handleLoadMorePosts = async () => {
    if (!profileUsername || !postsCursor || !hasMorePosts || loadingMorePosts) {
      return;
    }

    setLoadingMorePosts(true);

    try {
      const res = await authFetch(
        buildProfilePostsUrl({
          username: profileUsername,
          cursor: postsCursor,
          sortBy,
          sortDir,
        })
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", text);
        return;
      }

      const data = await res.json();
      setPosts((prev) => {
        const existingIds = new Set(prev.map((post) => post.id));
        const incoming = (data.posts ?? []).filter((post) => !existingIds.has(post.id));
        return [...prev, ...incoming];
      });
      setPostsCursor(data.nextCursor ?? null);
      setHasMorePosts(Boolean(data.hasMore));
      setTotalPostsCount((prev) => Number(data.totalPosts ?? prev));
    } catch (err) {
      console.error("Failed to load more profile posts:", err);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const uploadEditorImage = async (blob, index) => {
    const formData = new FormData();
    const extension = blob.type.split("/")[1] || "png";
    formData.append("image", blob, `editor-image-${Date.now()}-${index}.${extension}`);

    const res = await authFetch("/api/posts/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.location;
  };

  const uploadEmbeddedImages = async (content) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const src = image.getAttribute("src") || "";

      image.style.maxWidth = "800px";
      image.style.height = "auto";

      if (!src.startsWith("data:image/")) {
        continue;
      }

      const blob = await fetch(src).then((response) => response.blob());
      const uploadedUrl = await uploadEditorImage(blob, index);
      image.setAttribute("src", uploadedUrl);
    }

    return doc.body.innerHTML;
  };

  const handleUpdatePost = async () => {
    // Validate title/content before sending update request
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editContent.trim() || editContent === "<p><br></p>") {
      toast.error("Content is required");
      return;
    }

    if (!editingPost) return;

    try {
      const content = await uploadEmbeddedImages(editContent);

      await updatePost(editingPost, editTitle, content);

      setPosts(prev =>
        prev.map(p =>
          p.id === editingPost
            ? { ...p, title: editTitle, content }
            : p
        )
      );

      setEditingPost(null);
      setEditTitle("");
      setEditContent("");
      setEditorLoaded(false);

      toast.success("Post updated!");

    } catch (err) {
      toast.error(err.message);
    }
  };

  const closeEditPostModal = () => {
    setEditingPost(null);
    setEditorLoaded(false);
  };

  if (!user) return null;

  const displayUser = isOwnProfile ? profileUser || user : profileUser;
  if (!displayUser) return null;

  return (
    <div className="min-h-screen bg-[#C8CFD8]">
      <Navbar user={user} showCreatePost={true} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {/* Profile Header */}
        <div className="rounded-t-lg bg-[#ACB8C9] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div
                to={isOwnProfile ? "/profile" : `/profile/${username}`}
                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#D6E4F0] bg-[#21005D]/10 sm:h-24 sm:w-24"
              >
                  {displayUser?.avatar ? (
                  <img
                    src={displayUser.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-black sm:text-3xl">{displayUser?.fullname}</h1>
                <p className="text-base text-gray-700 sm:text-lg">{displayUser?.username}</p>
                <div className="mt-3 grid grid-cols-3 gap-4 sm:flex sm:gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{totalPostsCount}</div>
                    <div className="text-sm text-gray-700">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{followersCount}</div>
                    <div className="text-sm text-gray-700">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{followingCount}</div>
                    <div className="text-sm text-gray-700">Following</div>
                  </div>
                </div>
              </div>
            </div>
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditProfile(true)}
                className="w-full rounded-md bg-[#1E56A0] px-6 py-2 font-medium text-white sm:w-auto"
              >
                Edit Profile
              </button>
            ) : (
              <FollowButton
                currentUserId={user.id}
                targetUserId={profileUser?.id}
                onChange={() => refetchFollowCounts()}
              />
            )}
          </div>
          <p className="mt-4 text-sm text-black sm:text-base">{displayUser?.bio || "No bio yet"}</p>
        </div>

        {/* Posts Section */}
        <div className="rounded-b-lg bg-white p-5 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold text-[#0C245E] sm:text-3xl">
              {isOwnProfile ? "Your Posts" : `${displayUser?.username}'s Posts`}
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const nextSortBy = e.target.value;
                    setSortBy(nextSortBy);
                    setSortDir("desc");
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="upvotes">Upvotes</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Order</span>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {sortBy === "date" ? (
                    <>
                      <option value="desc">Newest first</option>
                      <option value="asc">Oldest first</option>
                    </>
                  ) : (
                    <>
                      <option value="desc">Most upvoted</option>
                      <option value="asc">Least upvoted</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="animate-pulse rounded-lg border border-gray-200 p-4 sm:p-6">
                    <div className="mb-3 h-6 w-1/2 rounded bg-gray-200" />
                    <div className="mb-2 h-4 w-full rounded bg-gray-200" />
                    <div className="h-4 w-5/6 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center text-gray-500 py-10 text-lg">
                No posts yet.
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="rounded-lg border border-gray-200 p-4 sm:p-6">
                  {editingPost !== post.id && (
                    <>
                      <h3 className="mb-3 text-xl font-semibold text-black sm:text-2xl">
                        {post.title}
                      </h3>
                      <div
                        className="text-gray-700 mb-4"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    </>
                  )}
                  {editingPost !== post.id && (
                    <div className="mb-4 flex flex-wrap items-center gap-4">
                      <PostVoteControls
                        postId={post.id}
                        initialVoteCount={post.vote_count ?? 0}
                        initialCurrentUserVote={post.current_user_vote ?? 0}
                        onChange={handlePostVoteChange}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                    <div className="flex flex-wrap gap-4">
                      <Link
                        to={`/post/${post.id}`}
                        className="text-[#1E56A0] font-medium"
                      >
                        Read More
                      </Link>
                      {isOwnProfile && (
                        <>
                      <button
                          className="text-[#1E56A0] font-medium"
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditTitle(post.title);
                            setEditContent(post.content);
                            setEditorLoaded(false);
                          }}>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletePostId(post.id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600 font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loadingPosts && posts.length > 0 && hasMorePosts && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMorePosts}
                disabled={loadingMorePosts}
                className="rounded-md bg-[#1E56A0] px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMorePosts ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>

      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6"
          onClick={closeEditPostModal}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeEditPostModal}
              className="absolute right-4 top-4 text-gray-500 transition-colors hover:text-black"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-[#0C245E] sm:text-3xl">Edit Post</h3>
              <p className="mt-2 text-sm text-gray-500">Changes are applied only when you save.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-lg font-semibold text-black">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1E56A0]"
                />
              </div>

              <div>
                <label className="mb-3 block text-lg font-semibold text-black">Content</label>
                <div className="relative min-h-[420px] [&_.tox-edit-area__iframe]:max-h-[420px] [&_.tox-edit-area__iframe]:overflow-y-auto sm:min-h-[560px] sm:[&_.tox-edit-area__iframe]:max-h-[560px] lg:min-h-[700px] lg:[&_.tox-edit-area__iframe]:max-h-[700px]">
                  {!editorLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-500">
                      Loading editor...
                    </div>
                  )}
                  <Editor
                    ref={editEditorRef}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    value={editContent}
                    onInit={(evt, editor) => {
                      editEditorRef.current = editor;
                      setEditorLoaded(true);
                    }}
                    onEditorChange={(newContent) => setEditContent(newContent)}
                    init={{
                      license_key: "gpl",
                      promotion: false,
                      branding: false,
                      menubar: false,
                      height: window.innerWidth < 640 ? 420 : window.innerWidth < 1024 ? 560 : 700,
                      skin_url: "/tinymce/skins/ui/oxide",
                      plugins: ["lists", "link", "image", "code"],
                      toolbar:
                        "undo redo | fontsize | bold italic underline strikethrough | forecolor | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link | image | code",
                      toolbar_sticky: true,
                      toolbar_sticky_offset: 0,
                      file_picker_types: "image",
                      file_picker_callback: (callback) => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";

                        input.onchange = () => {
                          const file = input.files?.[0];
                          if (!file) {
                            return;
                          }

                          const reader = new FileReader();
                          reader.onload = () => {
                            const image = new Image();
                            image.onload = () => {
                              const maxWidth = 800;
                              const width = image.width > maxWidth ? maxWidth : image.width;
                              const height =
                                image.width > maxWidth
                                  ? Math.round((image.height * maxWidth) / image.width)
                                  : image.height;

                              callback(reader.result, {
                                title: file.name,
                                width: String(width),
                                height: String(height),
                                style: `max-width: ${maxWidth}px; height: auto;`,
                              });
                            };
                            image.src = reader.result;
                          };
                          reader.readAsDataURL(file);
                        };

                        input.click();
                      },
                      image_title: true,
                      image_dimensions: true,
                      object_resizing: "img",
                      extended_valid_elements: "img[src|alt|width|height|style]",
                      valid_styles: { "*": "width,height,max-width" },
                      convert_urls: false,
                      remove_script_host: false,
                      automatic_uploads: false,
                      paste_data_images: true,
                      allow_local_files: true,
                      element_format: "html",
                      schema: "html5",
                      entity_encoding: "raw",
                      autosave_ask_before_unload: false,
                      statusbar: false,
                      content_style: `
                        body {
                          font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        }
                        img {
                          max-width: 800px;
                          height: auto;
                        }
                      `,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button
                  onClick={closeEditPostModal}
                  className="rounded-md border border-gray-300 px-6 py-2 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePost}
                  className="rounded-md bg-[#1E56A0] px-6 py-2 font-medium text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 sm:p-6 lg:p-8">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      className="w-full h-full object-cover"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 m-auto" />
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatarUpload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedImage(file);
                      setPreviewImage(URL.createObjectURL(file));
                    }
                  }}
                />

                <label
                  htmlFor="avatarUpload"
                  className="text-[#1E56A0] font-medium cursor-pointer"
                >
                  Change Image
                </label>
              </div>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Edit Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">Fullname:</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.fullname}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, fullname: e.target.value });
                      setErrors({ ...errors, fullname: "" });
                    }}
                    className={`px-4 py-2 border rounded-md w-full ${
                      errors.fullname ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.fullname && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">Email:</label>
                <div className="w-full">
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, email: e.target.value });
                      setErrors({ ...errors, email: "" });
                    }}
                    className={`px-4 py-2 border rounded-md w-full ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">Username:</label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, username: e.target.value });
                      setErrors({ ...errors, username:""})
                    }}
                    className={`px-4 py-2 border rounded-md w-full ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">Bio:</label>
                <div className="w-full">
                  <textarea
                    value={editFormData.bio}
                    onChange={(e) =>{
                      setEditFormData({ ...editFormData, bio: e.target.value });
                      setErrors({ ...errors, bio:""})
                    }}
                    rows="4"
                    className={`px-4 py-2 border rounded-md w-full resize-none ${
                      errors.bio ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 pt-6 sm:flex-row sm:gap-4">
                <button
                  type="submit"
                  className="rounded-md bg-[#1E56A0] px-8 py-2 font-medium text-white"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="border border-gray-300 px-8 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-md rounded-lg bg-white p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">
                Are you sure you want to delete this post?
              </h3>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDeletePost}
                className="bg-red-600 text-white px-6 py-2 rounded-md font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
                className="border border-gray-300 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
