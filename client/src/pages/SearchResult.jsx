import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import { authFetch } from "../services/api";
import PostCard from "../components/posts/PostCard";
import useRequireAuth from "../hooks/useRequireAuth";
import PostVoteControls from "../components/PostVoteControls";
import BookmarkButton from "../components/BookmarkButton";

export default function SearchResult() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await authFetch(
          `/api/posts/search?${new URLSearchParams({
            q: query,
            sortBy,
            sortDir,
          }).toString()}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, sortBy, sortDir]);

  const handleSortChange = (nextSortBy, nextSortDir) => {
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
  };

  const handlePostVoteChange = ({ postId, voteCount, currentUserVote }) => {
    setResults((prev) =>
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

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
          Search results for:{" "}
          <span className="text-forum-primary">&ldquo;{query}&rdquo;</span>
        </h1>

        {!loading && results.length > 0 && (
          <p className="mb-6 text-lg text-forum-muted">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Auto-styled: sorting controls are inferred because the Figma search screen only shows the result list state. */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
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
                  <option value="desc">Most votes</option>
                  <option value="asc">Least votes</option>
                </>
              )}
            </select>
          </label>
        </div>

        {loading && <p className="mt-6 text-forum-muted">Searching...</p>}

        {!loading && results.length === 0 && (
          <p className="mt-6 text-forum-muted">
            No posts found for &ldquo;{query}&rdquo;.
          </p>
        )}

        <div className="space-y-5">
          {results.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              authorNode={
                <>
                  By{" "}
                  <Link
                    to={`/profile/${encodeURIComponent(post.username)}`}
                    className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                  >
                    {post.username}
                  </Link>
                </>
              }
              meta={new Date(post.created_at).toLocaleString()}
              readMoreTo={`/post/${post.id}`}
            >
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
            </PostCard>
          ))}
        </div>
      </main>
    </div>
  );
}
