import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { User, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updatePost, deletePost } from "../services/postService";
import Navbar from "../components/navigation/Navbar";
import FollowButton from "../components/FollowButton";
import PostVoteControls from "../components/PostVoteControls";
import PostCard from "../components/posts/PostCard";
import { Editor } from "@tinymce/tinymce-react";
import { authFetch } from "../services/api";
import { uploadEmbeddedImages } from "../utils/editorImages";
import useRequireAuth from "../hooks/useRequireAuth";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const editEditorRef = useRef(null);
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const isOwnProfile = user && (!username || username === user.username);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [errors, setErrors] = useState({});

  const [profileUser, setProfileUser] = useState(null);
  const effectiveUsername = username || user?.username;
  const targetUserId = profileUser?.id || (isOwnProfile ? user?.id : null);

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
  const [postsCount, setPostsCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!effectiveUsername) return;

    const fetchProfileUser = async () => {
      const res = await authFetch(`/api/users/${effectiveUsername}`);
      const data = await res.json();
      setProfileUser(data);
    };

    fetchProfileUser();
  }, [effectiveUsername]);

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
    if (!effectiveUsername) return;

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const params = new URLSearchParams({
          limit: "5",
          sortBy,
          sortDir,
        });
        const res = await authFetch(
          `/api/posts/user/${encodeURIComponent(effectiveUsername)}?${params.toString()}`
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("Server error:", text);
          return;
        }

        const data = await res.json();
        setPosts(data.posts);
        setPostsCount(data.totalCount ?? data.posts.length);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
      } finally {
        setLoadingPosts(false);
      }
    };

    setPosts([]);
    setPostsCount(0);
    setCursor(null);
    setHasMore(false);
    fetchPosts();
  }, [effectiveUsername, sortBy, sortDir]);

  useEffect(() => {
    if (!user || !targetUserId || isOwnProfile) return;

    authFetch("/api/follow/seen", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        followerId: user.id,
        followingId: targetUserId,
      }),
    }).catch((err) => console.error("Failed to mark as seen:", err));
  }, [user, targetUserId, isOwnProfile]);

  useEffect(() => {
    if (showEditProfile && user) {
      setEditFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
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

  const handleLoadMore = async () => {
    if (!effectiveUsername || !cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: "5",
        sortBy,
        sortDir,
        cursor,
      });
      const res = await authFetch(
        `/api/posts/user/${encodeURIComponent(effectiveUsername)}?${params.toString()}`
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", text);
        return;
      }

      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setPostsCount(data.totalCount ?? postsCount);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSortChange = (nextSortBy, nextSortDir) => {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
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
          body: formData,
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
          avatar: avatarUrl,
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

      setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
      setPostsCount((prev) => Math.max(0, prev - 1));

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

  const handleUpdatePost = async () => {
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

      setPosts((prev) =>
        prev.map((p) =>
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

  if (!ready || !user) return null;
  
  const displayUser = isOwnProfile ? profileUser || user : profileUser;
  if (!displayUser) return null;

  return (
    <div className="min-h-screen bg-[#C8CFD8]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="rounded-t-lg bg-[#ACB8C9] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#D6E4F0] bg-[#21005D]/10 sm:h-24 sm:w-24">
                {displayUser?.avatar ? (
                  <img
                    src={displayUser.avatar}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-black sm:text-3xl">
                  {displayUser?.fullname}
                </h1>
                <p className="text-base text-gray-700 sm:text-lg">
                  {displayUser?.username}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-4 sm:flex sm:gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{postsCount}</div>
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
                targetUserId={targetUserId}
                onChange={() => refetchFollowCounts()}
              />
            )}
          </div>

          <p className="mt-4 text-sm text-black sm:text-base">
            {displayUser?.bio || "No bio yet"}
          </p>
        </div>

        <div className="rounded-b-lg bg-white p-5 sm:p-6 lg:p-8">
          <h2 className="mb-6 text-2xl font-semibold text-[#0C245E] sm:text-3xl">
            {isOwnProfile ? "Your Posts" : `${effectiveUsername}'s Posts`}
          </h2>

          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-[#F7F9FC] p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#0C245E]">
                Sort by
                <select
                  value={sortBy}
                  onChange={(e) =>
                    handleSortChange(e.target.value, e.target.value === "upvotes" ? sortDir : "desc")
                  }
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-black"
                >
                  <option value="date">Date</option>
                  <option value="upvotes">Upvotes</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-[#0C245E]">
                Order
                <select
                  value={sortDir}
                  onChange={(e) => handleSortChange(sortBy, e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-black"
                >
                  {sortBy === "date" ? (
                    <>
                      <option value="desc">Newest first</option>
                      <option value="asc">Oldest first</option>
                    </>
                  ) : (
                    <>
                      <option value="desc">Most upvotes</option>
                      <option value="asc">Least upvotes</option>
                    </>
                  )}
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
                  >
                    <div className="mb-3 h-6 w-2/3 rounded bg-gray-200" />
                    <div className="mb-2 h-4 w-full rounded bg-gray-200" />
                    <div className="h-4 w-5/6 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-10 text-center text-lg text-gray-500">
                No posts yet.
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    meta={new Date(post.created_at).toLocaleString()}
                    readMoreTo={`/post/${post.id}`}
                    className="border-gray-200"
                  >
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

                    {isOwnProfile && editingPost !== post.id && (
                      <div className="flex flex-wrap gap-4">
                        <button
                          className="font-medium text-[#1E56A0]"
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditTitle(post.title);
                            setEditContent(post.content);
                            setEditorLoaded(false);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletePostId(post.id);
                            setShowDeleteDialog(true);
                          }}
                          className="font-medium text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </PostCard>
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="rounded-md bg-[#1E56A0] px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
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
              <h3 className="text-2xl font-semibold text-[#0C245E] sm:text-3xl">
                Edit Post
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Changes are applied only when you save.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-lg font-semibold text-black">
                  Title
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1E56A0]"
                />
              </div>

              <div>
                <label className="mb-3 block text-lg font-semibold text-black">
                  Content
                </label>
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
                      height:
                        window.innerWidth < 640
                          ? 420
                          : window.innerWidth < 1024
                          ? 560
                          : 700,
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
                              const width =
                                image.width > maxWidth ? maxWidth : image.width;
                              const height =
                                image.width > maxWidth
                                  ? Math.round(
                                      (image.height * maxWidth) / image.width
                                    )
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
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 sm:p-6 lg:p-8">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-8 text-center">
              <div className="inline-flex flex-col items-center">
                <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      className="h-full w-full object-cover"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={user.avatar}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="m-auto h-12 w-12" />
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
                  className="cursor-pointer font-medium text-[#1E56A0]"
                >
                  Change Image
                </label>
              </div>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                Edit Profile
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">
                  Fullname:
                </label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.fullname}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        fullname: e.target.value,
                      });
                      setErrors({ ...errors, fullname: "" });
                    }}
                    className={`w-full rounded-md border px-4 py-2 ${
                      errors.fullname ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.fullname && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.fullname}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">
                  Email:
                </label>
                <div className="w-full">
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      });
                      setErrors({ ...errors, email: "" });
                    }}
                    className={`w-full rounded-md border px-4 py-2 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">
                  Username:
                </label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        username: e.target.value,
                      });
                      setErrors({ ...errors, username: "" });
                    }}
                    className={`w-full rounded-md border px-4 py-2 ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium sm:pt-2 sm:text-right">Bio:</label>
                <div className="w-full">
                  <textarea
                    value={editFormData.bio}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, bio: e.target.value });
                      setErrors({ ...errors, bio: "" });
                    }}
                    rows="4"
                    className={`w-full resize-none rounded-md border px-4 py-2 ${
                      errors.bio ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
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
                  className="rounded-md border border-gray-300 px-8 py-2 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-md rounded-lg bg-white p-5 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">
                Are you sure you want to delete this post?
              </h3>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleDeletePost}
                className="rounded-md bg-red-600 px-6 py-2 font-medium text-white"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
                className="rounded-md border border-gray-300 px-6 py-2 font-medium"
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
