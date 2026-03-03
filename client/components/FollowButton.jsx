import useFollow from "../hooks/useFollow";

export default function FollowButton({ currentUserId, targetUserId, onChange }) {
  const { isFollowing, toggleFollow, loading } =
    useFollow(currentUserId, targetUserId);

  if (!currentUserId || currentUserId === targetUserId) return null;

  const handleFollowClick = async () => {
    const newState = await toggleFollow();  
    onChange?.(newState);
  };
  
  return (
    <button
      onClick={handleFollowClick}
      disabled={loading}
      className={`px-6 py-2 rounded-md font-medium transition ${
        isFollowing
          ? "bg-gray-300 text-black hover:bg-gray-400"
          : "bg-[#1E56A0] text-white hover:bg-[#163172]"
      }`}
    >
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}