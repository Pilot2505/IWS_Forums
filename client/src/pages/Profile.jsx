import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Search, User, X, Trash2 } from "lucide-react";
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
        setConnectionsError(
          "Unable to load your followers and following right now.",
        );
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
          `/api/posts/user/${encodeURIComponent(effectiveUsername)}?${params.toString()}`,
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
        `/api/posts/user/${encodeURIComponent(effectiveUsername)}?${params.toString()}`,
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
          : post,
      ),
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
      toast.error(
        "This post contains language that violates community standards. Please edit it!",
      );
      return;
    }

    if (!editingPost) return;

    try {
      const content = await uploadEmbeddedImages(editContent);
      const nextTags = normalizeTagsInput(editTagsInput);

      const updatedPost = await updatePost(
        editingPost,
        editTitle,
        content,
        nextTags,
      );

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost
            ? {
                ...p,
                title: updatedPost.title || editTitle,
                content,
                tags: updatedPost.tags || nextTags,
                primary_category:
                  updatedPost.primary_category ?? p.primary_category,
                primary_category_label:
                  updatedPost.primary_category_label ??
                  p.primary_category_label,
              }
            : p,
        ),
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
        const haystack =
          `${person.fullname || ""} ${person.username || ""}`.toLowerCase();
        return haystack.includes(normalizedConnectionsQuery);
      })
    : selectedConnectionsList;

  const renderConnectionUser = (person, showNewPosts = false) => (
    <Link
      to={`/profile/${encodeURIComponent(person.username)}`}
      className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 transition hover:bg-forum-panel/70"
    >
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary">
        {person.avatar ? (
          <img
            src={person.avatar}
            alt={person.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-forum-inkStrong">
          {person.fullname || person.username}
        </div>
        <div className="truncate text-xs text-forum-muted">
          @{person.username}
        </div>
      </div>

      {showNewPosts && Number(person.newPosts) > 0 && (
        <span className="shrink-0 rounded-full bg-forum-primarySoft px-2.5 py-1 text-xs font-medium text-forum-primary">
          {person.newPosts} new
        </span>
      )}
    </Link>
  );

  if (!ready || !user) return null;

  const displayUser = isOwnProfile ? profileUser || user : profileUser;
  if (!displayUser) return null;

  return (
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-content px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <section className="overflow-hidden rounded-[28px] border border-forum-border bg-forum-surface shadow-panel">
          <div className="border-b border-forum-border bg-forum-panel/70 p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary shadow-sm sm:h-28 sm:w-28">
                  {displayUser?.avatar ? (
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12" />
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-semibold tracking-tight text-forum-inkStrong sm:text-4xl">
                    {displayUser?.fullname}
                  </h1>
                  <p className="mt-1 text-lg text-forum-muted">
                    @{displayUser?.username}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
                    <div className="rounded-2xl border border-forum-border bg-forum-surface p-3 text-center">
                      <div className="text-2xl font-semibold text-forum-inkStrong">
                        {postsCount}
                      </div>
                      <div className="text-sm text-forum-muted">Posts</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveConnectionsView("followers")}
                      aria-pressed={activeConnectionsView === "followers"}
                      className={`text-center transition ${
                        activeConnectionsView === "followers"
                          ? "rounded-2xl border border-forum-primary/25 bg-forum-primarySoft/40 px-3 py-3 shadow-sm"
                          : "rounded-2xl border border-forum-border bg-forum-surface px-3 py-3 hover:bg-forum-panel"
                      }`}
                    >
                      <div className="text-2xl font-semibold text-forum-inkStrong">
                        {followersCount}
                      </div>
                      <div className="text-sm text-forum-muted">Followers</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveConnectionsView("following")}
                      aria-pressed={activeConnectionsView === "following"}
                      className={`text-center transition ${
                        activeConnectionsView === "following"
                          ? "rounded-2xl border border-forum-primary/25 bg-forum-primarySoft/40 px-3 py-3 shadow-sm"
                          : "rounded-2xl border border-forum-border bg-forum-surface px-3 py-3 hover:bg-forum-panel"
                      }`}
                    >
                      <div className="text-2xl font-semibold text-forum-inkStrong">
                        {followingCount}
                      </div>
                      <div className="text-sm text-forum-muted">Following</div>
                    </button>
                  </div>
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setShowEditProfile(true)}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-forum-primary px-5 font-semibold text-white transition hover:bg-forum-primaryDark sm:w-auto"
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

            <p className="mt-5 max-w-3xl text-sm leading-7 text-forum-muted sm:text-base">
              {displayUser?.bio || "No bio yet"}
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-forum-inkStrong">
              {isOwnProfile ? "Your Posts" : `${effectiveUsername}'s Posts`}
            </h2>

            {/* Auto-styled: the sort toolbar is inferred from the profile-post management workflow because Figma only shows the base list state. */}
            <div className="mb-6 flex flex-col gap-3 rounded-[24px] border border-forum-border bg-forum-panel/70 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-forum-inkStrong">
                  Sort by
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      handleSortChange(
                        e.target.value,
                        e.target.value === "upvotes" ? sortDir : "desc",
                      )
                    }
                    className="h-12 rounded-2xl border border-forum-border bg-white px-4 text-sm text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
                  >
                    <option value="date">Date</option>
                    <option value="upvotes">Upvotes</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-forum-inkStrong">
                  Order
                  <select
                    value={sortDir}
                    onChange={(e) => handleSortChange(sortBy, e.target.value)}
                    className="h-12 rounded-2xl border border-forum-border bg-white px-4 text-sm text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
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
                      className="animate-pulse rounded-[28px] border border-forum-border bg-white p-6 shadow-panel"
                    >
                      <div className="mb-3 h-6 w-2/3 rounded-full bg-slate-100" />
                      <div className="mb-2 h-4 w-full rounded-full bg-slate-100" />
                      <div className="h-4 w-5/6 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-forum-borderStrong bg-forum-panel/40 py-10 text-center text-lg text-forum-muted">
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
                    >
                      {editingPost !== post.id && (
                        <div className="flex flex-wrap items-center gap-4">
                          <PostVoteControls
                            postId={post.id}
                            initialVoteCount={post.vote_count ?? 0}
                            initialCurrentUserVote={post.current_user_vote ?? 0}
                            onChange={handlePostVoteChange}
                          />
                          <BookmarkButton
                            postId={post.id}
                            initialBookmarked={Boolean(post.is_bookmarked)}
                          />
                        </div>
                      )}

                      {isOwnProfile && editingPost !== post.id && (
                        <div className="flex flex-wrap gap-4">
                          <button
                            type="button"
                            className="font-semibold text-forum-primary"
                            onClick={() => {
                              setEditingPost(post.id);
                              setEditTitle(post.title);
                              setEditTagsInput(
                                parseTagsValue(post.tags).join(", "),
                              );
                              setEditContent(post.content);
                              setEditorLoaded(false);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletePostId(post.id);
                              setShowDeleteDialog(true);
                            }}
                            className="font-semibold text-forum-danger"
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
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-forum-border bg-white px-5 font-semibold text-forum-inkStrong transition hover:border-forum-primary/30 hover:text-forum-primary disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loadingMore ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {isOwnProfile && activeConnectionsView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={closeConnectionsPanel}
              aria-hidden="true"
            />

            {/* Auto-styled: the followers/following management panel is inferred from the existing feature because Figma only shows the top-level profile state. */}
            <aside className="relative z-10 flex h-full w-full max-w-xl flex-col rounded-[28px] border border-forum-border bg-forum-surface shadow-dialog">
              <div className="flex items-start justify-between gap-4 border-b border-forum-border px-5 py-5 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forum-primary">
                    Connections panel
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-forum-inkStrong sm:text-3xl">
                    {selectedConnectionsLabel}
                  </h2>
                  <p className="mt-1 text-sm text-forum-muted">
                    Only you can see these lists.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeConnectionsPanel}
                  className="rounded-full border border-forum-border bg-white p-2 text-forum-subtle transition hover:bg-forum-panel hover:text-forum-inkStrong"
                  aria-label="Close connections panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-forum-border px-5 py-4 sm:px-6">
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-forum-panel p-1">
                  <button
                    type="button"
                    onClick={() => setActiveConnectionsView("followers")}
                    className={`rounded-xl px-4 py-3 text-left transition-colors ${
                      activeConnectionsView === "followers"
                        ? "bg-white shadow-sm"
                        : "text-forum-muted hover:bg-white/70"
                    }`}
                  >
                    <div className="text-sm font-semibold text-forum-inkStrong">
                      Followers
                    </div>
                    <div className="text-xs text-forum-muted">
                      {followersCount} total
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveConnectionsView("following")}
                    className={`rounded-xl px-4 py-3 text-left transition-colors ${
                      activeConnectionsView === "following"
                        ? "bg-white shadow-sm"
                        : "text-forum-muted hover:bg-white/70"
                    }`}
                  >
                    <div className="text-sm font-semibold text-forum-inkStrong">
                      Following
                    </div>
                    <div className="text-xs text-forum-muted">
                      {followingCount} total
                    </div>
                  </button>
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-2xl bg-forum-panel px-4 py-3 text-sm text-forum-muted">
                  <Search className="h-4 w-4 shrink-0 text-forum-subtle" />
                  <input
                    type="text"
                    value={connectionsQuery}
                    onChange={(e) => setConnectionsQuery(e.target.value)}
                    placeholder={`Search ${selectedConnectionsLabel?.toLowerCase() || "connections"}`}
                    className="w-full bg-transparent text-sm text-forum-inkStrong outline-none placeholder:text-forum-subtle"
                  />
                </label>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {connectionsError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {connectionsError}
                  </div>
                ) : connectionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse rounded-xl border border-forum-border bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                            <div className="h-3 w-1/3 rounded-full bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedConnectionsList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-forum-borderStrong bg-forum-panel px-4 py-8 text-sm text-forum-muted">
                    {normalizedConnectionsQuery
                      ? "No results found."
                      : activeConnectionsView === "followers"
                        ? "No one is following you yet."
                        : "You are not following anyone yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-forum-border">
                    {visibleConnectionsList.map((person) => (
                      <div key={person.id}>
                        {renderConnectionUser(
                          person,
                          activeConnectionsView === "following",
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-6 sm:items-center"
          onClick={closeEditPostModal}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-forum-border bg-forum-surface p-4 shadow-dialog sm:p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeEditPostModal}
              className="absolute right-4 top-4 text-forum-subtle transition hover:text-forum-inkStrong"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-8">
              <h3 className="text-3xl font-semibold tracking-tight text-forum-inkStrong">
                Edit Post
              </h3>
              <p className="mt-2 text-sm text-forum-muted">
                Changes are applied only when you save.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="profile-post-title-editor"
                  className="mb-3 block text-lg font-semibold text-forum-inkStrong"
                >
                  Title
                </label>
                <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                  <div className="relative min-h-[112px] [&_.tox]:border-0 [&_.tox-editor-header]:border-b [&_.tox-editor-header]:border-forum-border [&_.tox-edit-area__iframe]:max-h-[112px] [&_.tox-edit-area__iframe]:overflow-y-auto">
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
                            font-family: Inter, system-ui, sans-serif;
                            font-size: 1rem;
                            color: #191c1d;
                          }
                        `,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-lg font-semibold text-forum-inkStrong">
                  Tags
                </label>
                <input
                  value={editTagsInput}
                  onChange={(e) => setEditTagsInput(e.target.value)}
                  placeholder="React, performance, UI"
                  className="h-14 w-full rounded-2xl border border-forum-border bg-white px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
                />
                <p className="mt-3 text-sm leading-6 text-forum-muted">
                  Add multiple tags with commas. Example: React, performance,
                  UI.
                </p>
              </div>

              <div>
                <label className="mb-3 block text-lg font-semibold text-forum-inkStrong">
                  Content
                </label>
                <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                  <div className="relative min-h-[420px] [&_.tox]:border-0 [&_.tox-editor-header]:border-b [&_.tox-editor-header]:border-forum-border [&_.tox-edit-area__iframe]:max-h-[420px] [&_.tox-edit-area__iframe]:overflow-y-auto sm:min-h-[560px] sm:[&_.tox-edit-area__iframe]:max-h-[560px] lg:min-h-[700px] lg:[&_.tox-edit-area__iframe]:max-h-[700px]">
                    {!editorLoaded && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-forum-panel text-forum-muted">
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
                      onEditorChange={(newContent) =>
                        setEditContent(newContent)
                      }
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
                                  image.width > maxWidth
                                    ? maxWidth
                                    : image.width;
                                const height =
                                  image.width > maxWidth
                                    ? Math.round(
                                        (image.height * maxWidth) / image.width,
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
                        extended_valid_elements:
                          "img[src|alt|width|height|style]",
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
                            font-family: Inter, system-ui, sans-serif;
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
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditPostModal}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-forum-border px-5 font-medium text-forum-inkStrong transition hover:bg-forum-panel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePost}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-forum-primary px-5 font-medium text-white transition hover:bg-forum-primaryDark"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-6 sm:items-center">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-dialog sm:p-6 lg:p-8">
            <button
              type="button"
              onClick={() => setShowEditProfile(false)}
              className="absolute right-4 top-4 text-forum-subtle"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-8 text-center">
              <div className="inline-flex flex-col items-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-forum-border bg-forum-primarySoft text-forum-primary">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
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
                  className="cursor-pointer font-semibold text-forum-primary"
                >
                  Change Image
                </label>
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-forum-inkStrong">
                Edit Profile
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium text-forum-inkStrong sm:pt-2 sm:text-right">
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
                    className={`h-12 w-full rounded-2xl border bg-white px-4 text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15 ${
                      errors.fullname ? "border-red-500" : "border-forum-border"
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
                <label className="font-medium text-forum-inkStrong sm:pt-2 sm:text-right">
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
                    className={`h-12 w-full rounded-2xl border bg-white px-4 text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15 ${
                      errors.email ? "border-red-500" : "border-forum-border"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-start sm:gap-4">
                <label className="font-medium text-forum-inkStrong sm:pt-2 sm:text-right">
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
                    className={`h-12 w-full rounded-2xl border bg-white px-4 text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15 ${
                      errors.username ? "border-red-500" : "border-forum-border"
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
                <label className="font-medium text-forum-inkStrong sm:pt-2 sm:text-right">
                  Bio:
                </label>
                <div className="w-full">
                  <textarea
                    value={editFormData.bio}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, bio: e.target.value });
                      setErrors({ ...errors, bio: "" });
                    }}
                    rows="4"
                    className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15 ${
                      errors.bio ? "border-red-500" : "border-forum-border"
                    }`}
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 pt-6 sm:flex-row sm:justify-end sm:gap-4">
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-forum-primary px-8 font-medium text-white transition hover:bg-forum-primaryDark"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-forum-border px-8 font-medium text-forum-inkStrong transition hover:bg-forum-panel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-dialog sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forum-dangerSoft text-forum-danger">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-forum-inkStrong">
                  Delete this post?
                </h3>
                <p className="mt-1 text-sm text-forum-muted">
                  This action permanently removes the post from your profile.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePostId(null);
                }}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-forum-border px-6 font-medium text-forum-inkStrong transition hover:bg-forum-panel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-forum-danger px-6 font-medium text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
