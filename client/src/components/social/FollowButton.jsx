import useFollow from "@/hooks/useFollow";

export default function FollowButton({ currentUserId, targetUserId, onChange, className = "" }) {
  const { isFollowing, toggleFollow, loading } =
    useFollow(currentUserId, targetUserId);

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
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        isFollowing
          ? "border-[#c1c7d3] bg-[#f3f4f5] text-[#191c1d] hover:bg-[#e1e3e4]"
          : "border-[#c1c7d3] bg-white text-[#005da7] hover:bg-[#f3f4f5]"
      } ${className}`}
    >
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
