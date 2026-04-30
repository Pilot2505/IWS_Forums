import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import { authFetch } from "../services/api";
import PostCard from "../components/posts/PostCard";
import useRequireAuth from "../hooks/useRequireAuth";

export default function SearchResult() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await authFetch(
          `/api/posts/search?q=${encodeURIComponent(query)}`
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
  }, [query]);

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
        <h2 className="mb-2 text-2xl font-semibold text-[#0C245E]">
          Search results for:{" "}
          <span className="text-[#1E56A0]">&ldquo;{query}&rdquo;</span>
        </h2>

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
            />
          ))}
        </div>
      </div>
    </div>
  );
}