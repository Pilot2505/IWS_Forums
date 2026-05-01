import { authFetch } from "./api";

export async function toggleBookmark(postId) {
  const res = await authFetch(`/api/bookmarks/${postId}/toggle`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to update bookmark");
  }

  return res.json();
}

export async function getBookmarks() {
  const res = await authFetch("/api/bookmarks");

  if (!res.ok) {
    throw new Error("Failed to load bookmarks");
  }

  return res.json();
}
