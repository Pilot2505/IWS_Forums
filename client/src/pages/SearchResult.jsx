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
          }).toString()}`
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
          : post
      )
    );
  };

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
        <h2 className="mb-2 text-2xl font-semibold text-[#0C245E]">
          Search results for:{" "}
          <span className="text-[#1E56A0]">&ldquo;{query}&rdquo;</span>
        </h2>

        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#1E56A0]/10 bg-[#F6F9FC] p-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#0C245E]">
            Sort by
            <select
              value={sortBy}
              onChange={(e) =>
                handleSortChange(
                  e.target.value,
                  e.target.value === "upvotes" ? sortDir : "desc"
                )
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
                  <option value="desc">Most votes</option>
                  <option value="asc">Least votes</option>
                </>
              )}
            </select>
          </label>
        </div>

        {loading && <p className="mt-6 text-gray-500">Searching...</p>}

        {!loading && results.length === 0 && (
          <p className="mt-6 text-gray-500">
            No posts found for &ldquo;{query}&rdquo;.
          </p>
        )}

        {!loading && results.length > 0 && (
          <p className="mb-6 text-sm text-gray-500">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
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
                    className="font-medium text-[#1E56A0] hover:underline"
                  >
                    {post.username}
                  </Link>
                </>
              }
              meta={new Date(post.created_at).toLocaleString()}
              readMoreTo={`/post/${post.id}`}
              className="border-b border-r border-black"
            >
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <PostVoteControls
                  postId={post.id}
                  initialVoteCount={post.vote_count ?? 0}
                  initialCurrentUserVote={post.current_user_vote ?? 0}
                  onChange={handlePostVoteChange}
                />
                <BookmarkButton postId={post.id} initialBookmarked={Boolean(post.is_bookmarked)} />
              </div>
            </PostCard>
          ))}
        </div>
      </div>
    </div>
  );
}
