import { ChevronDown, ChevronUp } from "lucide-react";
import useVote from "../hooks/useVote";

export default function PostVoteControls({
  postId,
  initialVoteCount = 0,
  initialCurrentUserVote = 0,
  onChange,
  className = "",
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
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-forum-border bg-forum-panel px-2 py-2 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={voteUp}
        disabled={loading}
        aria-pressed={upActive}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          upActive
            ? "bg-forum-primary text-white"
            : "bg-white text-forum-muted hover:bg-forum-primarySoft hover:text-forum-primary"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <span className="min-w-10 text-center text-sm font-semibold text-forum-inkStrong">
        {voteCount}
      </span>

      <button
        type="button"
        onClick={voteDown}
        disabled={loading}
        aria-pressed={downActive}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          downActive
            ? "bg-forum-danger text-white"
            : "bg-white text-forum-muted hover:bg-forum-dangerSoft hover:text-forum-danger"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
