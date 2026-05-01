import pool from "../config/db.js";

export async function createNotification({
  userId,
  actorUserId,
  type,
  postId = null,
  commentId = null,
  message,
}) {
  if (!userId || !actorUserId || Number(userId) === Number(actorUserId)) {
    return null;
  }

  const [result] = await pool.execute(
    `
    INSERT INTO notifications (user_id, actor_user_id, type, post_id, comment_id, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
    `,
    [userId, actorUserId, type, postId, commentId, message]
  );

  return result.insertId;
}

export function parseNotificationRow(row) {
  return {
    ...row,
    is_read: Boolean(row.is_read),
  };
}
