import { useState, useEffect } from "react";

export default function useFollow(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    const checkFollow = async () => {
      try {
        const res = await fetch(
          `/api/follow/is-following?followerId=${currentUserId}&followingId=${targetUserId}`,
          { credentials: 'include' }
        );
        
        if (!res.ok) throw new Error("Failed to check follow");

        const data = await res.json();
        setIsFollowing(data.isFollowing);
      } catch (err) {
        console.error(err);
      }
    };

    checkFollow();
  }, [currentUserId, targetUserId]);

  const toggleFollow = async () => {
    if (!currentUserId || !targetUserId) return;

    setLoading(true);

    try {
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch("/api/follow", {
        credentials: 'include',
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: targetUserId,
        }),
      });

      const data = await res.json();
      setIsFollowing(data.isFollowing);
      return data.isFollowing;
    } catch (err) {
      console.error(err);
    } finally {
    setLoading(false);
    }
  };

  return { isFollowing, toggleFollow, loading };
}