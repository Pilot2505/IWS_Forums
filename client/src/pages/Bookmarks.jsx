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
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 border-b border-forum-border pb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
              Saved Posts
            </h1>
            <p className="mt-3 text-lg text-forum-muted">
              Posts you bookmarked for later reading.
            </p>
          </div>
          <Link
            to="/home"
            className="mt-4 inline-flex text-base font-medium text-forum-primary transition hover:text-forum-primaryDark"
          >
            Back to feed
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[28px] border border-forum-border bg-forum-surface p-6 shadow-panel"
              >
                <div className="mb-3 h-6 w-2/3 rounded-full bg-slate-100" />
                <div className="mb-2 h-4 w-full rounded-full bg-slate-100" />
                <div className="h-4 w-5/6 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-forum-borderStrong bg-forum-surface p-10 text-center text-forum-muted shadow-panel">
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
                      className="font-semibold text-forum-primary transition hover:text-forum-primaryDark"
                    >
                      {post.username}
                    </Link>
                  </>
                }
                meta={new Date(post.created_at).toLocaleString()}
                readMoreTo={`/post/${post.id}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <BookmarkButton
                    postId={post.id}
                    initialBookmarked={true}
                    onChange={(nextSaved) => {
                      if (!nextSaved) {
                        setBookmarks((prev) =>
                          prev.filter((item) => item.id !== post.id),
                        );
                      }
                    }}
                  />
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
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-forum-border bg-forum-surface px-5 font-semibold text-forum-inkStrong transition hover:border-forum-primary/30 hover:text-forum-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
