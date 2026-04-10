import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { authFetch } from "../services/api";

export default function SearchResult() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

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

  function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} showCreatePost={true} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
        <h2 className="text-2xl font-semibold text-[#0C245E] mb-2">
          Search results for:{" "}
          <span className="text-[#1E56A0]">&ldquo;{query}&rdquo;</span>
        </h2>

        {loading && (
          <p className="text-gray-500 mt-6">Searching...</p>
        )}

        {!loading && results.length === 0 && (
          <p className="text-gray-500 mt-6">No posts found for &ldquo;{query}&rdquo;.</p>
        )}

        {!loading && results.length > 0 && (
          <p className="text-gray-500 mb-6 text-sm">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="space-y-5">
          {results.map((post) => (
            <div
              key={post.id}
              className="rounded-lg bg-white border-b border-r border-black p-5 sm:p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                <h3 className="text-xl font-semibold text-black sm:text-2xl">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600">
                  By{" "}
                  <Link
                    to={`/profile/${encodeURIComponent(post.username)}`}
                    className="text-[#1E56A0] font-medium hover:underline"
                  >
                    {post.username}
                  </Link>
                </p>
              </div>

              <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                {stripHtml(post.content)}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleString()}
                </span>
                <Link
                  to={`/post/${post.id}`}
                  className="text-[#1E56A0] font-medium text-sm hover:underline"
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
