import pool from "../config/db.js";
import { parseNotificationRow } from "../utils/notifications.js";

const buildNotificationsQuery = (unreadOnly, limit) => {
  const unreadClause = unreadOnly ? "AND n.is_read = 0" : "";

  return `
    SELECT n.*, actor.username AS actor_username, actor.avatar AS actor_avatar,
           posts.title AS post_title, posts.id AS post_id_ref
    FROM notifications n
    JOIN users actor ON n.actor_user_id = actor.id
    LEFT JOIN posts ON n.post_id = posts.id
    WHERE n.user_id = ?
    ${unreadClause}
    ORDER BY n.created_at DESC
    LIMIT ${limit}
  `;
};

export const getNotifications = async (req, res) => {
  const userId = Number(req.user?.id);
  const limit = Math.min(Math.max(Math.trunc(Number(req.query.limit) || 20), 1), 50);
  const unreadOnly = String(req.query.unreadOnly || "false") === "true";

  if (!Number.isInteger(userId)) {
    return res.status(401).json({ message: "Invalid user" });
  }

  try {
    const [rows] = await pool.execute(buildNotificationsQuery(unreadOnly, limit), [userId]);

    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    res.json({
      notifications: rows.map(parseNotificationRow),
      unreadCount: Number(countRows[0]?.unreadCount) || 0,
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
