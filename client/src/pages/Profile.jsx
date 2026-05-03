import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { ChevronDown, Search, User, X, Trash2 } from "lucide-react";
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
import BookmarkButton from "../components/BookmarkButton";
import { stripHtml } from "../utils/content";
import { normalizeTagsInput, parseTagsValue } from "../utils/postMeta";
import { containsBlockedWord } from "../utils/moderation";

const emptyEditFormData = {
  fullname: "",
  email: "",
  username: "",
  bio: "",
};

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
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");
  const [activeConnectionsView, setActiveConnectionsView] = useState(null);
  const [connectionsQuery, setConnectionsQuery] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [editFormData, setEditFormData] = useState(emptyEditFormData);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
    if (!isOwnProfile || !targetUserId) {
      setFollowersList([]);
      setFollowingList([]);
      setConnectionsError("");
      setConnectionsLoading(false);
      setActiveConnectionsView(null);
      return undefined;
    }
    let cancelled = false;
    const fetchFollowLists = async () => {
      setConnectionsLoading(true);
      setConnectionsError("");
      try {
        const [followersRes, followingRes] = await Promise.all([
          authFetch(`/api/follow/followers/${targetUserId}`),
          authFetch(`/api/follow/following/${targetUserId}`),
        ]);
        if (!followersRes.ok) {
          throw new Error("Failed to fetch followers");
        }
        if (!followingRes.ok) {
          throw new Error("Failed to fetch following");
        }
        const [followersData, followingData] = await Promise.all([
          followersRes.json(),
          followingRes.json(),
        ]);
        if (cancelled) return;
        setFollowersList(followersData || []);
        setFollowingList(followingData || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading follow lists:", err);
        setConnectionsError("Unable to load your followers and following right now.");
      } finally {
        if (!cancelled) {
          setConnectionsLoading(false);
        }
      }
    };
    fetchFollowLists();
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, targetUserId]);
  useEffect(() => {
    if (!activeConnectionsView) {
      setConnectionsQuery("");
      return;
    }
    setConnectionsQuery("");
  }, [activeConnectionsView]);
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
  useEffect(() => {
    return () => {
      if (previewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);
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
      setPostsCount((currentCount) => data.totalCount ?? currentCount);
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

  const sortValue = `${sortBy}:${sortDir}`;
  const sortLabelMap = {
    "date:desc": "Newest first",
    "date:asc": "Oldest first",
    "upvotes:desc": "Most upvotes",
    "upvotes:asc": "Most downvotes",
  };
  const sortLabel = sortLabelMap[sortValue] ?? "Newest first";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const closeEditProfile = () => {
    setShowEditProfile(false);
    setSelectedImage(null);
    setPreviewImage(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      let avatarUrl = user.avatar;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("avatar", selectedImage);
        const uploadRes = await authFetch("/api/users/upload-avatar", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || uploadData.message || "Failed to upload avatar");
        }

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
      const updatedUser = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          updatedUser.message || updatedUser.error || "Failed to update profile"
        );
      }
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileUser(updatedUser);
      navigate(`/profile/${updatedUser.username}`);
      toast.success("Profile updated successfully!");
      closeEditProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Update failed");
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
    const trimmedTitle = stripHtml(editTitle).trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }
    if (!editContent.trim() || editContent === "<p><br></p>") {
      toast.error("Content is required");
      return;
    }
    if (containsBlockedWord(trimmedTitle) || containsBlockedWord(editContent)) {
      toast.error("This post contains language that violates community standards. Please edit it!");
      return;
    }
    if (!editingPost) return;
    try {
      const content = await uploadEmbeddedImages(editContent);
      const nextTags = normalizeTagsInput(editTagsInput);
      const updatedPost = await updatePost(editingPost, editTitle, content, nextTags);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost
            ? {
                ...p,
                title: updatedPost.title || editTitle,
                content,
                tags: updatedPost.tags || nextTags,
                primary_category: updatedPost.primary_category ?? p.primary_category,
                primary_category_label:
                  updatedPost.primary_category_label ?? p.primary_category_label,
              }
            : p
        )
      );
      setEditingPost(null);
      setEditTitle("");
      setEditTagsInput("");
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
  const closeConnectionsPanel = () => {
    setConnectionsQuery("");
    setActiveConnectionsView(null);
  };
  const selectedConnectionsLabel =
    activeConnectionsView === "followers"
      ? "Followers"
      : activeConnectionsView === "following"
        ? "Following"
        : null;
  const selectedConnectionsList =
    activeConnectionsView === "followers"
      ? followersList
      : activeConnectionsView === "following"
        ? followingList
        : [];
  const normalizedConnectionsQuery = connectionsQuery.trim().toLowerCase();
  const visibleConnectionsList = normalizedConnectionsQuery
    ? selectedConnectionsList.filter((person) => {
        const haystack = `${person.fullname || ""} ${person.username || ""}`.toLowerCase();
        return haystack.includes(normalizedConnectionsQuery);
      })
    : selectedConnectionsList;
  const renderConnectionUser = (person, showNewPosts = false) => (
    <Link
      to={`/profile/${encodeURIComponent(person.username)}`}
      className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 transition-colors hover:bg-[#eef4ff]"
    >
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#d4e3ff]/50 text-[#005da7]">
        {person.avatar ? (
          <img src={person.avatar} alt={person.username} className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#001c39]">
          {person.fullname || person.username}
        </div>
        <div className="truncate text-xs text-[#485e7e]">@{person.username}</div>
      </div>
      {showNewPosts && Number(person.newPosts) > 0 && (
        <span className="shrink-0 rounded-full bg-[#d4e3ff]/50 px-2.5 py-1 text-xs font-medium text-[#005da7]">
          {person.newPosts} new
        </span>
      )}
    </Link>
  );
  if (!ready || !user) return null;
  
  const displayUser = isOwnProfile ? profileUser || user : profileUser;
  if (!displayUser) return null;
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#e6ebf5] text-[#191c1d] antialiased">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#d9e5ff] blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[#bfd5ff] blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/3 h-80 w-80 rounded-full bg-[#e1ebff] blur-3xl" />
      </div>
      <Navbar user={user} setUser={setUser} showCreatePost={true} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="rounded-t-2xl border border-[#c1d9fe] border-b-0 bg-white/80 p-5 backdrop-blur sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#c1d9fe] bg-[#d4e3ff]/50 sm:h-24 sm:w-24">
                {displayUser?.avatar ? (
                  <img
                    src={displayUser.avatar}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-[#005da7]" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#001c39] sm:text-3xl">
                  {displayUser?.fullname}
                </h1>
                <p className="text-base text-[#485e7e] sm:text-lg">
                  @{displayUser?.username}
                </p>
                <div className="mt-3 grid grid-cols-3 items-center gap-4 sm:flex sm:gap-8">
                  <div className="text-center px-3 py-2">
                    <div className="text-2xl font-semibold">{postsCount}</div>
                    <div className="text-sm text-[#485e7e]">Posts</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveConnectionsView("followers")}
                    aria-pressed={activeConnectionsView === "followers"}
                    className={`text-center transition-colors ${
                      activeConnectionsView === "followers"
                        ? "rounded-2xl border border-[#005da7]/25 bg-[#005da7]/5 px-3 py-2 shadow-sm"
                        : "rounded-2xl px-3 py-2 hover:bg-[#eef4ff]"
                    }`}
                  >
                    <div className="text-2xl font-semibold">{followersCount}</div>
                    <div className="text-sm text-[#485e7e]">Followers</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConnectionsView("following")}
                    aria-pressed={activeConnectionsView === "following"}
                    className={`text-center transition-colors ${
                      activeConnectionsView === "following"
                        ? "rounded-2xl border border-[#005da7]/25 bg-[#005da7]/5 px-3 py-2 shadow-sm"
                        : "rounded-2xl px-3 py-2 hover:bg-[#eef4ff]"
                    }`}
                  >
                    <div className="text-2xl font-semibold">{followingCount}</div>
                    <div className="text-sm text-[#485e7e]">Following</div>
                  </button>
                </div>
              </div>
            </div>
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditProfile(true)}
                  className="w-full rounded-md bg-[#005da7] px-6 py-2 font-medium text-white transition-colors hover:bg-[#004883] sm:w-auto"
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
          <p className="mt-4 text-sm text-[#001c39] sm:text-base">
            {displayUser?.bio || "No bio yet"}
          </p>
        </div>
        {isOwnProfile && activeConnectionsView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={closeConnectionsPanel}
              aria-hidden="true"
            />
            <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-[#c1d9fe] bg-white/90 shadow-2xl backdrop-blur">
              <div className="flex items-start justify-between gap-4 border-b border-[#c1d9fe] px-5 py-5 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#005da7]">
                    Connections panel
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#001c39] sm:text-3xl">
                    {selectedConnectionsLabel}
                  </h2>
                  <p className="mt-1 text-sm text-[#485e7e]">Only you can see these lists.</p>
                </div>
                <button
                  type="button"
                  onClick={closeConnectionsPanel}
                  className="rounded-full border border-[#c1d9fe] bg-white p-2 text-[#485e7e] transition-colors hover:bg-[#eef4ff] hover:text-[#001c39]"
                  aria-label="Close connections panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="border-b border-[#c1d9fe] px-5 py-4 sm:px-6">
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#eef4ff] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveConnectionsView("followers")}
                    className={`rounded-xl px-4 py-3 text-left transition-colors ${
                      activeConnectionsView === "followers"
                        ? "bg-white shadow-sm"
                        : "text-[#485e7e] hover:bg-white/70"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#001c39]">Followers</div>
                    <div className="text-xs text-[#485e7e]">{followersCount} total</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConnectionsView("following")}
                    className={`rounded-xl px-4 py-3 text-left transition-colors ${
                      activeConnectionsView === "following"
                        ? "bg-white shadow-sm"
                        : "text-[#485e7e] hover:bg-white/70"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#001c39]">Following</div>
                    <div className="text-xs text-[#485e7e]">{followingCount} total</div>
                  </button>
                </div>
                <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F7F9FC] px-4 py-3 text-sm text-[#485e7e]">
                  <Search className="h-4 w-4 shrink-0 text-[#717783]" />
                  <input
                    type="text"
                    value={connectionsQuery}
                    onChange={(e) => setConnectionsQuery(e.target.value)}
                    placeholder={`Search ${selectedConnectionsLabel?.toLowerCase() || "connections"}`}
                    className="w-full bg-transparent text-sm text-[#001c39] outline-none placeholder:text-[#717783]"
                  />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {connectionsError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {connectionsError}
                  </div>
                ) : connectionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="animate-pulse rounded-xl border border-[#d9e5ff] bg-white/90 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#d8e3f2]" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 rounded bg-[#d8e3f2]" />
                            <div className="h-3 w-1/3 rounded bg-[#d8e3f2]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedConnectionsList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#c1d9fe] bg-[#f7f9fc] px-4 py-8 text-sm text-[#485e7e]">
                    {normalizedConnectionsQuery
                      ? "No results found."
                      : activeConnectionsView === "followers"
                        ? "No one is following you yet."
                        : "You are not following anyone yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-[#e1e8f6]">
                    {visibleConnectionsList.map((person) => (
                      <div key={person.id}>{renderConnectionUser(person, activeConnectionsView === "following")}</div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
        <div className="border-t border-[#c1d9fe] px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
          <h2 className="mb-6 text-2xl font-semibold text-[#001c39] sm:text-3xl">
            {isOwnProfile ? "Your Posts" : `${effectiveUsername}'s Posts`}
          </h2>
          <div ref={sortMenuRef} className="relative mb-6 flex items-center justify-end">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={showSortMenu}
              onClick={() => setShowSortMenu((open) => !open)}
              className="relative inline-flex w-[250px] max-w-full items-center gap-2 rounded-md border border-[#c1d9fe] bg-[#eef4ff] px-3 py-2 text-sm text-[#485e7e] shadow-sm transition-colors hover:bg-[#f8f9fa]"
            >
              <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                Sort by:
              </span>
              <span className="font-label-md text-label-md text-sm text-[#485e7e] font-medium whitespace-nowrap">
                {sortLabel}
              </span>
              <ChevronDown className="ml-auto h-4 w-4 text-[#485e7e]" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-[250px] overflow-hidden rounded-md border border-[#c1d9fe] bg-white shadow-md">
                {[
                  ["date", "desc", "Newest first"],
                  ["date", "asc", "Oldest first"],
                  ["upvotes", "desc", "Most upvotes"],
                  ["upvotes", "asc", "Most downvotes"],
                ].map(([nextSortBy, nextSortDir, label]) => {
                  const isActive = sortBy === nextSortBy && sortDir === nextSortDir;

                  return (
                    <button
                      key={`${nextSortBy}:${nextSortDir}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        handleSortChange(nextSortBy, nextSortDir);
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-[#f3f4f5] text-[#005da7]"
                          : "text-[#191c1d] hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-6">
            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-lg border border-[#d9e5ff] bg-white/90 p-6"
                  >
                    <div className="mb-3 h-6 w-2/3 rounded bg-[#d8e3f2]" />
                    <div className="mb-2 h-4 w-full rounded bg-[#d8e3f2]" />
                    <div className="h-4 w-5/6 rounded bg-[#d8e3f2]" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-10 text-center text-lg text-[#485e7e]">
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
                    className="border-[#c1d9fe]"
                  >
                    {editingPost !== post.id && (
                      <div className="mb-4 flex flex-wrap items-center gap-4">
                        <PostVoteControls
                          postId={post.id}
                          initialVoteCount={post.vote_count ?? 0}
                          initialCurrentUserVote={post.current_user_vote ?? 0}
                          onChange={handlePostVoteChange}
                        />
                        <BookmarkButton postId={post.id} initialBookmarked={Boolean(post.is_bookmarked)} />
                      </div>
                    )}
                    {isOwnProfile && editingPost !== post.id && (
                      <div className="flex flex-wrap gap-4">
                        <button
                          className="font-medium text-[#005da7] transition-colors hover:text-[#004883]"
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditTitle(post.title);
                            setEditTagsInput(parseTagsValue(post.tags).join(", "));
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
                      className="rounded-md bg-[#005da7] px-6 py-3 font-medium text-white transition-colors hover:bg-[#004883] disabled:cursor-not-allowed disabled:bg-[#8bb3d7]"
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
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[#c1d9fe] bg-white/90 p-4 shadow-2xl backdrop-blur sm:p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeEditPostModal}
              className="absolute right-4 top-4 text-[#485e7e] transition-colors hover:text-[#001c39]"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-[#001c39] sm:text-3xl">
                Edit Post
              </h3>
              <p className="mt-2 text-sm text-[#485e7e]">
                Changes are applied only when you save.
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <label htmlFor="profile-post-title-editor" className="mb-1 block text-lg font-semibold text-[#001c39]">
                  Title
                </label>
                <div className="relative min-h-[112px] [&_.tox-edit-area__iframe]:max-h-[112px] [&_.tox-edit-area__iframe]:overflow-y-auto">
                  <Editor
                    id="profile-post-title-editor"
                    value={editTitle}
                    onEditorChange={(newTitle) => setEditTitle(newTitle)}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    init={{
                      license_key: "gpl",
                      promotion: false,
                      branding: false,
                      menubar: false,
                      statusbar: false,
                      placeholder: "Format your title here",
                      height: 100,
                      forced_root_block: false,
                      toolbar: "bold italic underline strikethrough",
                      plugins: [],
                      toolbar_sticky: false,
                      skin_url: "/tinymce/skins/ui/oxide",
                      valid_elements: "b,strong,i,em,u,s,br",
                      element_format: "html",
                      entity_encoding: "raw",
                      content_style: `
                        body {
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                          font-size: 1rem;
                        }
                      `,
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#485e7e]">
                  Tags
                </label>
                <input
                  value={editTagsInput}
                  onChange={(e) => setEditTagsInput(e.target.value)}
                  placeholder="React, performance, UI"
                  className="w-full rounded border border-[#c1d9fe] bg-white px-3 py-3 text-base text-[#001c39] outline-none focus:border-[#005da7] focus:ring-2 focus:ring-[#005da7]/15"
                />
                <p className="mt-0.5 text-xs text-[#485e7e]">
                  Add multiple tags with commas. Example: React, performance, UI.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-lg font-semibold text-[#001c39]">
                  Content
                </label>
                <div className="relative min-h-[420px] [&_.tox-edit-area__iframe]:max-h-[420px] [&_.tox-edit-area__iframe]:overflow-y-auto sm:min-h-[560px] sm:[&_.tox-edit-area__iframe]:max-h-[560px] lg:min-h-[700px] lg:[&_.tox-edit-area__iframe]:max-h-[700px]">
                  {!editorLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-[#c1d9fe] bg-[#f7f9fc] text-[#485e7e]">
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
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={closeEditPostModal}
                  className="rounded-md border border-[#c1d9fe] px-6 py-2 font-medium text-[#485e7e] transition-colors hover:border-[#005da7] hover:text-[#001c39]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePost}
                  className="rounded-md bg-[#005da7] px-6 py-2 font-medium text-white transition-colors hover:bg-[#004883]"
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
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#c1d9fe] bg-white/90 p-5 shadow-2xl backdrop-blur sm:p-6 lg:p-8">
            <button
              onClick={closeEditProfile}
              className="absolute right-4 top-4 text-[#485e7e] transition-colors hover:text-[#001c39]"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="mb-8 text-center">
              <div className="inline-flex flex-col items-center">
                <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border border-[#c1d9fe]">
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
                  onChange={handleAvatarChange}
                />
                <label
                  htmlFor="avatarUpload"
                  className="cursor-pointer font-medium text-[#005da7] transition-colors hover:text-[#004883]"
                >
                  Change Image
                </label>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#001c39] sm:text-3xl">
                Edit Profile
              </h2>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium text-[#485e7e] sm:pt-2 sm:text-right">
                  Fullname:
                </label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.fullname || ""}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        fullname: e.target.value,
                      });
                      setErrors({ ...errors, fullname: "" });
                    }}
                    className={`w-full rounded-md border px-4 py-2 ${
                      errors.fullname ? "border-red-500" : "border-[#c1d9fe]"
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
                <label className="font-medium text-[#485e7e] sm:pt-2 sm:text-right">
                  Email:
                </label>
                <div className="w-full">
                  <input
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      });
                      setErrors({ ...errors, email: "" });
                    }}
                    className={`w-full rounded-md border px-4 py-2 ${
                      errors.email ? "border-red-500" : "border-[#c1d9fe]"
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
                <label className="font-medium text-[#485e7e] sm:pt-2 sm:text-right">
                  Username:
                </label>
                <div className="w-full">
                  <input
                    type="text"
                    value={editFormData.username || ""}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        username: e.target.value,
                      });
                      setErrors({ ...errors, username: "" });
                    }}
                    className={`w-full rounded-md border px-4 py-2 ${
                      errors.username ? "border-red-500" : "border-[#c1d9fe]"
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
                <label className="font-medium text-[#485e7e] sm:pt-2 sm:text-right">Bio:</label>
                <div className="w-full">
                  <textarea
                    value={editFormData.bio || ""}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        bio: e.target.value,
                      });
                      setErrors({ ...errors, bio: "" });
                    }}
                    rows="4"
                    className={`w-full resize-none rounded-md border px-4 py-2 ${
                      errors.bio ? "border-red-500" : "border-[#c1d9fe]"
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
                  className="rounded-md bg-[#005da7] px-8 py-2 font-medium text-white transition-colors hover:bg-[#004883]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={closeEditProfile}
                  className="rounded-md border border-[#c1d9fe] px-8 py-2 font-medium text-[#485e7e] transition-colors hover:border-[#005da7] hover:text-[#001c39]"
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
                className="rounded-md border border-[#c1d9fe] px-6 py-2 font-medium text-[#485e7e] transition-colors hover:border-[#005da7] hover:text-[#001c39]"
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
