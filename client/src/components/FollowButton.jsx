import useFollow from "../hooks/useFollow";

export default function FollowButton({
  currentUserId,
  targetUserId,
  onChange,
}) {
  const { isFollowing, toggleFollow, loading } = useFollow(
    currentUserId,
    targetUserId,
  );

  if (!currentUserId || currentUserId === targetUserId) return null;

  const handleFollowClick = async () => {
    const newState = await toggleFollow();
    onChange?.(newState);
  };

  return (
    <button
      type="button"
      onClick={handleFollowClick}
      disabled={loading}
      className={`inline-flex min-w-[124px] items-center justify-center rounded-2xl border px-5 py-2.5 text-sm font-semibold transition ${
        isFollowing
          ? "border-forum-border bg-forum-surface text-forum-muted hover:border-forum-primary/20 hover:text-forum-primary"
          : "border-forum-primary bg-forum-primary text-white shadow-sm hover:bg-forum-primaryDark"
      }`}
    >
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
