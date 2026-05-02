import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import Navbar from "../components/navigation/Navbar";
import { authFetch } from "../services/api";
import PostVoteControls from "../components/PostVoteControls";
import PostCard from "../components/posts/PostCard";
import useRequireAuth from "../hooks/useRequireAuth";
import BookmarkButton from "../components/BookmarkButton";

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
          p.id === Number(person.id) ? { ...p, newPosts: 0 } : p,
        ),
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
          : post,
      ),
    );
  };

  const handleSortChange = (nextSortBy, nextSortDir) => {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
  };

  if (!ready || !user) return null;

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userCategories = Array.isArray(storedUser.categories)
    ? storedUser.categories
    : [];

  return (
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto flex max-w-content flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:py-10">
        <section className="min-w-0 flex-1">
          <div className="rounded-[28px] border border-forum-border bg-forum-surface p-6 shadow-panel sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
                  {isRecommended ? "Recommended Posts" : "Recent Posts"}
                </h1>
                <p className="max-w-2xl text-lg text-forum-muted">
                  {isRecommended
                    ? "Curated from the topics you selected to keep your feed focused."
                    : "Select your interests to get personalized recommendations."}
                </p>

                {isRecommended && userCategories.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {userCategories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-forum-primarySoft px-3 py-1 text-xs font-semibold text-forum-primary"
                      >
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    ))}
                    <Link
                      to="/select-categories"
                      className="text-sm font-medium text-forum-primary transition hover:text-forum-primaryDark"
                    >
                      Change interests
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-forum-muted">
                    <Link
                      to="/select-categories"
                      className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                    >
                      Select your interests
                    </Link>{" "}
                    to personalize this feed.
                  </p>
                )}
              </div>

              <Link
                to="/create-post"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-forum-primary px-5 text-sm font-semibold text-white transition hover:bg-forum-primaryDark sm:w-fit"
              >
                + Create a New Post
              </Link>
            </div>
          </div>

          {/* Auto-styled: sort controls are not fully represented in Figma, so they follow the same card/filter language as the feed header. */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
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
                className="h-12 rounded-2xl border border-forum-border bg-forum-surface px-4 text-sm text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
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
                className="h-12 rounded-2xl border border-forum-border bg-forum-surface px-4 text-sm text-forum-inkStrong outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
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

          {loadingPosts ? (
            <div className="mt-6 space-y-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-[28px] border border-forum-border bg-forum-surface p-6 shadow-panel"
                >
                  <div className="mb-3 h-8 w-3/4 rounded-full bg-slate-100" />
                  <div className="mb-2 h-4 w-full rounded-full bg-slate-100" />
                  <div className="h-4 w-5/6 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-forum-borderStrong bg-forum-surface p-10 text-center text-forum-muted">
              {isRecommended
                ? "No posts found for your selected categories yet. Try changing your interests or check back later."
                : "No posts yet. Be the first to create one!"}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  authorNode={
                    <>
                      By{" "}
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenProfile({
                            id: post.user_id,
                            username: post.username,
                            fullname: post.fullname,
                            avatar: post.avatar,
                          })
                        }
                        className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                      >
                        {post.username}
                      </button>
                    </>
                  }
                  meta={new Date(post.created_at).toLocaleString()}
                  readMoreTo={`/post/${post.id}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                </PostCard>
              ))}
            </div>
          )}

          {hasMore && posts.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-forum-border bg-forum-surface px-5 font-semibold text-forum-inkStrong transition hover:border-forum-primary/30 hover:text-forum-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </section>

        <aside className="w-full rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-panel sm:p-6 lg:sticky lg:top-28 lg:w-[360px] lg:flex-shrink-0">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-3xl font-semibold tracking-tight text-forum-inkStrong">
              Following
            </h3>
            <span className="text-2xl text-forum-subtle">...</span>
          </div>

          {following.length === 0 ? (
            <p className="text-sm leading-6 text-forum-muted">
              You are not following anyone yet.
            </p>
          ) : (
            <div className="space-y-4">
              {following.map((person, index) => (
                <div key={person.id}>
                  <div className="flex items-center gap-4">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenProfile(person)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleOpenProfile(person);
                        }
                      }}
                      className={`h-12 w-12 cursor-pointer rounded-full p-[3px] transition-transform hover:scale-105 sm:h-14 sm:w-14 ${person.newPosts > 0
                          ? "bg-gradient-to-tr from-forum-primary to-sky-400"
                          : "bg-forum-panel"
                        }`}
                    >
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-forum-surface">
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={person.username}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-forum-primary" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenProfile(person)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenProfile(person);
                          }
                        }}
                        className="cursor-pointer truncate text-lg font-medium text-forum-inkStrong transition hover:text-forum-primary"
                      >
                        {person.fullname || person.username}
                      </p>
                      <p className="truncate text-sm text-forum-muted">
                        @{person.username}
                      </p>
                      {person.newPosts > 0 && (
                        <p className="text-sm text-forum-primary">
                          {person.newPosts} new post
                          {person.newPosts > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {index < following.length - 1 && (
                    <div className="mt-4 h-px bg-forum-border" />
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
