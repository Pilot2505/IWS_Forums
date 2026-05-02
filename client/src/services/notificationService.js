import { authFetch } from "./api";

export async function getNotifications({ limit = 20, unreadOnly = false, cursor = null } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    unreadOnly: unreadOnly ? "true" : "false",
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await authFetch(`/api/notifications?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Failed to load notifications");
  }

  return res.json();
}

export async function markNotificationRead(id) {
  const res = await authFetch(`/api/notifications/${id}/read`, {
    method: "PUT",
  });

  if (!res.ok) {
    throw new Error("Failed to mark notification read");
  }

  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await authFetch("/api/notifications/read-all", {
    method: "PUT",
  });

  if (!res.ok) {
    throw new Error("Failed to mark notifications read");
  }

  return res.json();
}
