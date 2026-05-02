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

export async function getBookmarks({ limit = 10, cursor = null } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await authFetch(`/api/bookmarks?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Failed to load bookmarks");
  }

  return res.json();
}
