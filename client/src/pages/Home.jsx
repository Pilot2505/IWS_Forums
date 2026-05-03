import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  User,
} from "lucide-react";
import Navbar from "../components/navigation/Navbar";
import { authFetch } from "../services/api";
import useRequireAuth from "../hooks/useRequireAuth";
import useVote from "../hooks/useVote";
import { toggleBookmark } from "../services/bookmarkService";
import { stripHtml } from "../utils/content";
import {
  formatTagLabel,
  getMatchingInterestTags,
  parseTagsValue,
} from "../utils/postMeta";

// Map category id -> label hiển thị
const CATEGORY_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C / C++",
  web: "Web Development",
  mobile: "Mobile Development",
  database: "Database",
  devops: "DevOps",
  ai_ml: "AI / Machine Learning",
  security: "Cybersecurity",
  cloud: "Cloud Computing",
  opensource: "Open Source",
};

function getStoredCategories() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return Array.isArray(storedUser.categories) ? storedUser.categories : [];
  } catch {
    return [];
  }
}

function FeedVoteControls({
  postId,
  initialVoteCount = 0,
  initialCurrentUserVote = 0,
  onChange,
}) {
  const { voteCount, currentUserVote, loading, voteUp, voteDown } = useVote({
    postId,
    initialVoteCount,
    initialCurrentUserVote,
    onChange,
  });

  const upActive = currentUserVote === 1;
  const downActive = currentUserVote === -1;

  return (
    <div className="flex flex-col items-center gap-1 text-[#717783]">
      <button
        type="button"
        onClick={voteUp}
        disabled={loading}
        aria-pressed={upActive}
        aria-label="Upvote"
        className={`rounded-full p-1.5 transition-colors ${
          upActive ? "text-[#005da7]" : "hover:text-[#005da7]"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <span
        className={`min-w-8 text-center text-sm font-medium ${
          upActive
            ? "text-[#005da7]"
            : downActive
              ? "text-[#ba1a1a]"
              : "text-[#191c1d]"
        }`}
      >
        {voteCount}
      </span>

      <button
        type="button"
        onClick={voteDown}
        disabled={loading}
        aria-pressed={downActive}
        aria-label="Downvote"
        className={`rounded-full p-1.5 transition-colors ${
          downActive ? "text-[#ba1a1a]" : "hover:text-[#ba1a1a]"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

function FeedBookmarkToggle({ postId, initialBookmarked = false, onChange }) {
  const [isBookmarked, setIsBookmarked] = useState(Boolean(initialBookmarked));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(Boolean(initialBookmarked));
  }, [initialBookmarked, postId]);

  const handleClick = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const nextState = await toggleBookmark(postId);
      setIsBookmarked(nextState.isBookmarked);
      onChange?.(nextState.isBookmarked);
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? "Remove bookmark" : "Save post"}
      title={isBookmarked ? "Saved" : "Save"}
      className={`rounded-full p-2 transition-colors ${
        isBookmarked ? "text-[#005da7]" : "text-[#717783] hover:text-[#005da7]"
      } ${loading ? "opacity-60" : ""}`}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-5 w-5" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </button>
  );
}

function FeedPostCard({
  post,
  userCategories,
  onVoteChange,
  onBookmarkChange,
  onOpenProfile,
}) {
  const tags = parseTagsValue(post.tags);
  const matchingTags = getMatchingInterestTags(tags, userCategories);
  const matchingTagSet = new Set(matchingTags);
  const orderedTags = [
    ...matchingTags,
    ...tags.filter((tag) => !matchingTagSet.has(tag)),
  ];

  return (
    <article className="rounded-xl border border-[#e1e3e4] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1 text-[#717783]">
          <FeedVoteControls
            postId={post.id}
            initialVoteCount={post.vote_count ?? 0}
            initialCurrentUserVote={post.current_user_vote ?? 0}
            onChange={onVoteChange}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link
              to={`/post/${post.id}`}
              className="min-w-0 flex-1 text-xl font-semibold leading-tight text-[#191c1d] transition-colors hover:text-[#005da7] sm:text-2xl"
            >
              <span dangerouslySetInnerHTML={{ __html: post.title }} />
            </Link>

            <FeedBookmarkToggle
              postId={post.id}
              initialBookmarked={Boolean(post.is_bookmarked)}
              onChange={(nextSaved) => onBookmarkChange(post.id, nextSaved)}
            />
          </div>

          {orderedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {orderedTags.slice(0, 4).map((tag) => {
                const isMatched = matchingTagSet.has(tag);

                return (
                  <span
                    key={tag}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isMatched
                        ? "border border-[#1E56A0]/20 bg-[#1E56A0]/10 text-[#1E56A0]"
                        : "bg-[#edeeef] text-[#414751]"
                    }`}
                  >
                    {formatTagLabel(tag)}
                  </span>
                );
              })}
            </div>
          )}

          <p className="mt-3 line-clamp-2 text-base leading-6 text-[#414751]">
            {stripHtml(post.content)}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e3e4]/60 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenProfile({
                    id: post.user_id,
                    username: post.username,
                    fullname: post.fullname,
                    avatar: post.avatar,
                  })
                }
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <span className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full border border-[#e1e3e4] bg-[#f3f4f5]">
                  {post.avatar ? (
                    <img
                      src={post.avatar}
                      alt={post.fullname || post.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[#717783]">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 truncate text-sm text-[#414751]">
                  By <span className="font-medium text-[#191c1d]">{post.fullname || post.username}</span>
                </span>
              </button>
              <span className="text-xs text-[#c1c7d3]">•</span>
              <span className="text-xs text-[#717783]">
                {new Date(post.created_at).toLocaleString()}
              </span>
            </div>

            <Link
              to={`/post/${post.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#005da7] transition-colors hover:text-[#2976c7]"
            >
              Read More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function FollowingItem({ person, onOpenProfile }) {
  const hasNewPosts = person.newPosts > 0;

  return (
    <button
      type="button"
      onClick={() => onOpenProfile(person)}
      className="group flex w-full items-center gap-3 text-left"
    >
      <div className="relative shrink-0">
        <div
          className={`rounded-full p-[3px] transition-all ${
            hasNewPosts
              ? "bg-gradient-to-tr from-[#005da7] via-[#2976c7] to-[#c1d9fe] shadow-[0_0_14px_rgba(0,93,167,0.2)]"
              : "bg-[#e1e3e4]"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f5]">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.fullname || person.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-[#717783]" />
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <h4 className="truncate text-sm font-medium text-[#191c1d] transition-colors group-hover:text-[#005da7]">
          {person.fullname || person.username}
        </h4>
        <p className="truncate text-xs text-[#717783]">
          {person.newPosts > 0
            ? `${person.newPosts} new post${person.newPosts > 1 ? "s" : ""}`
            : `@${person.username}`}
        </p>
      </div>
    </button>
  );
}

function LoadingCard() {
  return (
    <article className="flex gap-4 rounded-xl border border-[#e1e3e4] bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-gray-200" />
        <div className="h-4 w-8 rounded bg-gray-200" />
        <div className="h-5 w-5 rounded-full bg-gray-200" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-7 w-3/4 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-6 w-32 rounded-full bg-gray-200" />
          <div className="h-6 w-24 rounded-full bg-gray-200" />
        </div>
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="flex items-center justify-between border-t border-transparent pt-3">
          <div className="h-4 w-44 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showAllFollowing, setShowAllFollowing] = useState(false);
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
    if (!user) return;
    
    authFetch(`/api/follow/following/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch following");
        return res.json();
      })
      .then((data) => setFollowing(data))
      .catch((err) => console.error("Error loading following:", err));
  }, [user]);

  // Fetch posts mỗi khi user hoặc currentPage thay đổi
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const cats = storedUser.categories;
        const hasCategories = Array.isArray(cats) && cats.length > 0;
        const params = new URLSearchParams({
          limit: "5",
          sortBy,
          sortDir,
        });

        let endpoint = "/api/posts";
        if (hasCategories) {
          endpoint = "/api/posts/recommended";
          params.set("categories", cats.join(","));
        }

        const res = await authFetch(`${endpoint}?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        setPosts(data.posts);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
        setIsRecommended(hasCategories);
      } catch (err) {
        console.error("Error loading posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    setPosts([]);
    setCursor(null);
    setHasMore(false);
    fetchPosts();
  }, [user, sortBy, sortDir]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const cats = storedUser.categories;
      const hasCategories = Array.isArray(cats) && cats.length > 0;
      const params = new URLSearchParams({
        limit: "5",
        sortBy,
        sortDir,
        cursor,
      });

      let endpoint = "/api/posts";
      if (hasCategories) {
        endpoint = "/api/posts/recommended";
        params.set("categories", cats.join(","));
      }

      const res = await authFetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenProfile = async (person) => {
    try {
      const response = await authFetch("/api/follow/seen", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followerId: user.id,
          followingId: person.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update last_seen");
      }

      setFollowing((prev) =>
        prev.map((p) =>
          p.id === Number(person.id) ? { ...p, newPosts: 0 } : p
        )
      );

      navigate(`/profile/${encodeURIComponent(person.username)}`);
    } catch (err) {
      console.error("Failed to update last_seen:", err);
      navigate(`/profile/${encodeURIComponent(person.username)}`);
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

  const handlePostBookmarkChange = (postId, nextBookmarked) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, is_bookmarked: nextBookmarked }
          : post
      )
    );
  };

  const handleSortChange = (nextSortBy, nextSortDir) => {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
  };

  if (!ready || !user) return null;

  // Lấy label categories để hiển thị
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userCategories = Array.isArray(storedUser.categories) ? storedUser.categories : [];
  const visibleFollowing = showAllFollowing ? following : following.slice(0, 4);
  const sortValue = `${sortBy}:${sortDir}`;
  const sortLabelMap = {
    "date:desc": "Newest first",
    "date:asc": "Oldest first",
    "upvotes:desc": "Most upvotes",
    "upvotes:asc": "Most downvotes",
  };
  const sortLabel = sortLabelMap[sortValue] ?? "Newest first";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-8">
        <div className="flex-1">
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-[#e1e3e4] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div>
                    <h1 className="text-2xl font-semibold text-[#191c1d] sm:text-3xl">
                      {isRecommended ? "Recommended Posts" : "Recent Posts"}
                    </h1>
                  </div>

                  {isRecommended && userCategories.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[#717783]">Based on:</span>
                      {userCategories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full border border-[#1E56A0]/20 bg-[#1E56A0]/10 px-3 py-1 text-xs font-medium text-[#1E56A0]"
                        >
                          {CATEGORY_LABELS[cat] || cat}
                        </span>
                      ))}
                      <Link
                        to="/select-categories"
                        className="text-xs text-[#717783] underline decoration-[#c1c7d3] underline-offset-2 transition-colors hover:text-[#005da7]"
                      >
                        Change
                      </Link>
                    </div>
                  ) : !isRecommended ? (
                    <p className="text-sm text-[#717783]">
                      <Link
                        to="/select-categories"
                        className="font-medium text-[#005da7] transition-colors hover:text-[#2976c7]"
                      >
                        Select your interests
                      </Link>{" "}
                      to get personalized recommendations.
                    </p>
                  ) : null}
                </div>

                <Link
                  to="/create-post"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#005da7] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2976c7]"
                >
                  <span className="text-lg leading-none">+</span>
                  Create a New Post
                </Link>
              </div>
            </section>

            <div ref={sortMenuRef} className="relative mb-2 flex flex-col gap-2 items-end">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={showSortMenu}
                onClick={() => setShowSortMenu((open) => !open)}
                className="relative inline-flex w-[250px] max-w-full items-center gap-2 rounded-md border border-[#c1d9fe] bg-[#eef4ff] px-3 py-2 text-sm text-[#485e7e] shadow-sm transition-colors hover:bg-[#e4efff]"
                >
                <span className="text-sm font-medium text-[#001c39] whitespace-nowrap">
                  Sort by:
                </span>
                <span className="text-sm font-medium text-[#485e7e] whitespace-nowrap">
                  {sortLabel}
                </span>
                <span className="material-symbols-outlined ml-auto text-outline-variant text-[18px] leading-none shrink-0">
                  expand_more
                </span>
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
                    <LoadingCard key={item} />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-[#e1e3e4] bg-white px-6 py-10 text-center text-[#717783] shadow-sm">
                  {isRecommended
                    ? "No posts found for your selected categories yet. Try changing your interests or check back later."
                    : "No posts yet. Be the first to create one!"}
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      userCategories={userCategories}
                      onVoteChange={handlePostVoteChange}
                      onBookmarkChange={handlePostBookmarkChange}
                      onOpenProfile={handleOpenProfile}
                    />
                  ))}
                </div>
              )}
            </div>

            {hasMore && posts.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg bg-[#005da7] px-6 py-3 font-medium text-white transition-colors hover:bg-[#2976c7] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="hidden w-full flex-shrink-0 md:block lg:w-80">
          <div className="sticky top-24 rounded-xl border border-[#e1e3e4] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#191c1d]">Following</h2>
            </div>

            {following.length === 0 ? (
              <p className="text-sm text-[#717783]">
                You are not following anyone yet.
              </p>
            ) : (
              <div className="space-y-4">
                {visibleFollowing.map((person) => (
                  <FollowingItem
                    key={person.id}
                    person={person}
                    onOpenProfile={handleOpenProfile}
                  />
                ))}
              </div>
            )}

            {following.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllFollowing((prev) => !prev)}
                className="mt-6 w-full rounded-lg border border-transparent py-2 text-sm font-medium text-[#005da7] transition-colors hover:border-[#c1c7d3]/40 hover:bg-[#f3f4f5]"
              >
                {showAllFollowing ? "Show Less" : "View All"}
              </button>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
