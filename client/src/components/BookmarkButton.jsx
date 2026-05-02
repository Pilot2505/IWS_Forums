import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleBookmark } from "../services/bookmarkService";

export default function BookmarkButton({
  postId,
  initialBookmarked = false,
  onChange,
  className = "",
}) {
  const [isBookmarked, setIsBookmarked] = useState(Boolean(initialBookmarked));
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const nextState = await toggleBookmark(postId);
      setIsBookmarked(nextState.isBookmarked);
      onChange?.(nextState.isBookmarked);
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
      className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        isBookmarked
          ? "border-forum-primary/10 bg-forum-primary text-white shadow-lift"
          : "border-forum-border bg-forum-surface text-forum-muted hover:border-forum-primary/20 hover:bg-forum-primarySoft/50 hover:text-forum-primary"
      } ${className}`}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {loading ? "Saving..." : isBookmarked ? "Saved" : "Save"}
    </button>
  );
}
