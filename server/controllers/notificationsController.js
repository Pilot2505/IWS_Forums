import pool from "../config/db.js";
import { parseNotificationRow } from "../utils/notifications.js";

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

const encodeCursor = (notification) =>
  Buffer.from(
    JSON.stringify({
      createdAt: new Date(notification.created_at).toISOString(),
      id: Number(notification.id),
    })
  ).toString("base64");

const buildNotificationsQuery = (unreadOnly, cursorClause) => {
  const unreadClause = unreadOnly ? "AND n.is_read = 0" : "";

  return `
    SELECT n.*, actor.username AS actor_username, actor.avatar AS actor_avatar,
           posts.title AS post_title, posts.id AS post_id_ref
    FROM notifications n
    JOIN users actor ON n.actor_user_id = actor.id
    LEFT JOIN posts ON n.post_id = posts.id
    WHERE n.user_id = ?
    ${unreadClause}
    ${cursorClause}
    ORDER BY n.created_at DESC
    , n.id DESC
    LIMIT ?
  `;
};

export const getNotifications = async (req, res) => {
  const userId = Number(req.user?.id);
  const { cursor, limit, unreadOnly } = req.validated.query;

  if (!Number.isInteger(userId)) {
    return res.status(401).json({ message: "Invalid user" });
  }

  const decodedCursor = decodeCursor(cursor);
  const parsedCreatedAt = decodedCursor?.createdAt ? new Date(decodedCursor.createdAt) : null;
  const parsedId = Number(decodedCursor?.id);
  const hasValidCursor =
    parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime()) && Number.isInteger(parsedId);

  const cursorClause = hasValidCursor
    ? `
      AND (
        n.created_at < ?
        OR (
          n.created_at = ?
          AND n.id < ?
        )
      )
    `
    : "";

  const cursorParams = hasValidCursor
    ? [parsedCreatedAt, parsedCreatedAt, parsedId]
    : [];

  try {
    const [rows] = await pool.query(buildNotificationsQuery(unreadOnly, cursorClause), [
      userId,
      ...cursorParams,
      Number(limit) + 1,
    ]);

    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    const hasMore = rows.length > Number(limit);
    const notifications = hasMore ? rows.slice(0, Number(limit)) : rows;

    res.json({
      notifications: notifications.map(parseNotificationRow),
      unreadCount: Number(countRows[0]?.unreadCount) || 0,
      nextCursor:
        hasMore && notifications.length > 0
          ? encodeCursor(notifications[notifications.length - 1])
          : null,
      hasMore,
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.validated.params;

  try {
    const [result] = await pool.execute(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
