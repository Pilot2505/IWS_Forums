import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import PostCard from "../components/posts/PostCard";
import BookmarkButton from "../components/BookmarkButton";
import useRequireAuth from "../hooks/useRequireAuth";
import { getBookmarks } from "../services/bookmarkService";

export default function Bookmarks() {
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const data = await getBookmarks({ limit: 10 });
        setBookmarks(data.bookmarks || []);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await getBookmarks({ limit: 10, cursor });
      setBookmarks((prev) => [...prev, ...(data.bookmarks || [])]);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!ready || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0C245E] sm:text-4xl">Saved Posts</h1>
            <p className="mt-2 text-sm text-gray-600">Posts you bookmarked for later reading.</p>
          </div>
          <Link to="/home" className="text-sm font-medium text-[#1E56A0] hover:underline">
            Back to feed
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-lg bg-white p-6">
                <div className="mb-3 h-6 w-2/3 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#1E56A0]/20 bg-white p-10 text-center text-gray-500">
            No saved posts yet.
          </div>
        ) : (
          <div className="space-y-5">
            {bookmarks.map((post) => (
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
              >
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <BookmarkButton postId={post.id} initialBookmarked={true} onChange={(nextSaved) => {
                    if (!nextSaved) {
                      setBookmarks((prev) => prev.filter((item) => item.id !== post.id));
                    }
                  }} />
                </div>
              </PostCard>
            ))}
          </div>
        )}

        {hasMore && bookmarks.length > 0 && (
          <div className="mt-8 flex justify-center">
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
      </main>
    </div>
  );
}
