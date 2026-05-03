import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import useRequireAuth from "@/hooks/useRequireAuth";
import { getBookmarks, toggleBookmark } from "@/services/bookmarkService";
import { stripHtml } from "@/utils/content";
import { formatTagLabel, parseTagsValue } from "@/utils/postMeta";

function formatSavedDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
}

function BookmarkLoadingCard() {
  return (
    <article className="flex animate-pulse flex-col gap-4 rounded-xl border border-[#e1e3e4] bg-white p-4 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-6 w-3/4 rounded-full bg-[#e1e3e4]" />
          <div className="flex flex-wrap gap-4">
            <div className="h-4 w-32 rounded-full bg-[#e1e3e4]" />
            <div className="h-4 w-40 rounded-full bg-[#e1e3e4]" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-5 w-16 rounded-full bg-[#e1e3e4]" />
            <div className="h-5 w-20 rounded-full bg-[#e1e3e4]" />
            <div className="h-5 w-24 rounded-full bg-[#e1e3e4]" />
          </div>
        </div>
        <div className="h-9 w-24 rounded-lg bg-[#e1e3e4]" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded-full bg-[#e1e3e4]" />
        <div className="h-4 w-5/6 rounded-full bg-[#e1e3e4]" />
        <div className="h-4 w-2/3 rounded-full bg-[#e1e3e4]" />
      </div>
      <div className="flex justify-end border-t border-[#f3f4f5] pt-4">
        <div className="h-4 w-24 rounded-full bg-[#e1e3e4]" />
      </div>
    </article>
  );
}

function SavedBookmarkToggle({ postId, onRemove }) {
  const [isSaved, setIsSaved] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSaved(true);
  }, [postId]);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const nextState = await toggleBookmark(postId);
      setIsSaved(Boolean(nextState.isBookmarked));

      if (!nextState.isBookmarked) {
        onRemove?.(postId);
      }
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
      aria-pressed={isSaved}
      className={`shrink-0 inline-flex items-center gap-xs rounded-lg border px-3 py-1.5 font-label-md text-label-md transition-colors ${
        isSaved
          ? "border-[#c1d9fe] bg-[#c1d9fe] text-[#485e7e] hover:bg-[#005da7] hover:text-white"
          : "border-[#e1e3e4] bg-white text-[#191c1d] hover:bg-[#f3f4f5]"
      } ${loading ? "opacity-70" : ""}`}
    >
      <span
        className="material-symbols-outlined text-sm"
        style={{ fontVariationSettings: isSaved ? '"FILL" 1' : '"FILL" 0' }}
      >
        bookmark
      </span>
      <span className="hidden sm:inline">{loading ? "Saving..." : isSaved ? "Saved" : "Save"}</span>
    </button>
  );
}

function SavedPostCard({ post, onRemove }) {
  const tags = parseTagsValue(post.tags);
  const excerpt = stripHtml(post.content);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-[#e1e3e4] bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[20px] font-semibold leading-[28px] text-[#191c1d] md:text-[24px] md:leading-8">
            <Link to={`/post/${post.id}`} className="transition-colors hover:text-[#005da7] hover:underline">
              <span dangerouslySetInnerHTML={{ __html: post.title }} />
            </Link>
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#414751]">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">person</span>
              By{" "}
              <Link
                to={`/profile/${encodeURIComponent(post.username)}`}
                className="font-medium text-[#191c1d] transition-colors hover:text-[#005da7] hover:underline"
              >
                {post.fullname || post.username}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {formatSavedDate(post.created_at)}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-[#c1d9fe] px-2 py-1 text-[12px] font-medium leading-none text-[#485e7e]"
                >
                  #{formatTagLabel(tag)}
                </span>
              ))}
            </div>
          )}
        </div>

        <SavedBookmarkToggle postId={post.id} onRemove={onRemove} />
      </div>

      <p className="line-clamp-3 text-[16px] leading-6 text-[#414751]">
        {excerpt}
      </p>

      <div className="flex justify-end border-t border-[#f3f4f5] pt-4">
        <Link
          to={`/post/${post.id}`}
          className="group inline-flex items-center gap-1 font-label-md text-label-md text-[#005da7] transition-colors hover:text-[#2976c7]"
        >
          Read More
          <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}

function EmptyBookmarksState() {
  return (
    <div className="rounded-xl border border-dashed border-[#c1c7d3] bg-white p-8 text-center shadow-sm md:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ff] text-[#005da7]">
        <span className="material-symbols-outlined text-xl">bookmark</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[#191c1d]">No saved posts yet</h2>
      <p className="mt-2 text-sm leading-6 text-[#414751]">
        Bookmark posts you want to revisit later and they will appear here.
      </p>
      <Link
        to="/home"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#005da7] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2976c7]"
      >
        Back to feed
      </Link>
    </div>
  );
}

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
        const data = await getBookmarks({ limit: 6 });
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
      const data = await getBookmarks({ limit: 6, cursor });
      setBookmarks((prev) => [...prev, ...(data.bookmarks || [])]);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRemoveBookmark = (postId) => {
    setBookmarks((prev) => prev.filter((post) => post.id !== postId));
  };

  if (!ready || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-[#e1e3e4] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#191c1d] md:text-[32px] md:leading-[40px]">
              Saved Posts
            </h1>
            <p className="mt-2 text-[16px] leading-6 text-[#414751]">
              Posts you bookmarked for later reading.
            </p>
          </div>

          <Link
            to="/home"
            className="inline-flex items-center gap-1 font-label-md text-label-md text-[#005da7] transition-colors hover:text-[#2976c7]"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to feed
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((item) => (
              <BookmarkLoadingCard key={item} />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <EmptyBookmarksState />
        ) : (
          <div className="flex flex-col gap-4">
            {bookmarks.map((post) => (
              <SavedPostCard key={post.id} post={post} onRemove={handleRemoveBookmark} />
            ))}
          </div>
        )}

        {hasMore && bookmarks.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center rounded-lg bg-[#005da7] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2976c7] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
