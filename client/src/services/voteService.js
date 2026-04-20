import { authFetch } from "./api";

export async function togglePostVote(postId, vote) {
  const response = await authFetch(`/api/posts/${postId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vote }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.message || errorData?.error || "Failed to update vote";
    throw new Error(message);
  }

  return response.json();
}