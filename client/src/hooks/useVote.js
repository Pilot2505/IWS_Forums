import { useCallback, useEffect, useState } from "react";
import { togglePostVote } from "../services/voteService";

export default function useVote({
  postId,
  initialVoteCount = 0,
  initialCurrentUserVote = 0,
  onChange,
}) {
  const [voteCount, setVoteCount] = useState(Number(initialVoteCount) || 0);
  const [currentUserVote, setCurrentUserVote] = useState(
    Number(initialCurrentUserVote) || 0
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVoteCount(Number(initialVoteCount) || 0);
    setCurrentUserVote(Number(initialCurrentUserVote) || 0);
  }, [initialVoteCount, initialCurrentUserVote, postId]);

  const commitState = useCallback(
    (nextVoteCount, nextUserVote, notify = true) => {
      setVoteCount(nextVoteCount);
      setCurrentUserVote(nextUserVote);

      if (notify && onChange) {
        onChange({
          postId,
          voteCount: nextVoteCount,
          currentUserVote: nextUserVote,
        });
      }
    },
    [onChange, postId]
  );

  const vote = useCallback(
    async (desiredVote) => {
      if (!postId || loading) return;

      const previousVote = currentUserVote;
      const previousCount = voteCount;
      const nextVote = previousVote === desiredVote ? 0 : desiredVote;
      const optimisticVoteCount = previousCount + (nextVote - previousVote);

      setLoading(true);
      commitState(optimisticVoteCount, nextVote, true);

      try {
        const data = await togglePostVote(postId, nextVote);
        const serverVoteCount = Number(data.voteCount ?? optimisticVoteCount);
        const serverCurrentVote = Number(data.currentUserVote ?? nextVote);

        commitState(serverVoteCount, serverCurrentVote, true);
        return {
          voteCount: serverVoteCount,
          currentUserVote: serverCurrentVote,
        };
      } catch (error) {
        commitState(previousCount, previousVote, true);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [commitState, currentUserVote, loading, postId, voteCount]
  );

  return {
    voteCount,
    currentUserVote,
    loading,
    voteUp: () => vote(1),
    voteDown: () => vote(-1),
  };
}