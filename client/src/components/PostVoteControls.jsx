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
    <div className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={voteUp}
        disabled={loading}
        aria-pressed={upActive}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          upActive
            ? "bg-emerald-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <span className="min-w-10 text-center text-sm font-semibold text-gray-800">
        {voteCount}
      </span>

      <button
        type="button"
        onClick={voteDown}
        disabled={loading}
        aria-pressed={downActive}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          downActive
            ? "bg-rose-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-700"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}