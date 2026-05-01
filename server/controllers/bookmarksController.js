import pool from "../config/db.js";
import { enrichPostRow } from "../utils/postMeta.js";

export const getBookmarks = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute(
      `
      SELECT posts.*, users.username, users.avatar,
             COALESCE(vote_stats.vote_count, 0) AS vote_count,
             COALESCE(user_vote.vote, 0) AS current_user_vote,
             1 AS is_bookmarked
      FROM bookmarks b
      JOIN posts ON b.post_id = posts.id
      JOIN users ON posts.user_id = users.id
      LEFT JOIN (
        SELECT post_id, SUM(vote) AS vote_count
        FROM post_votes
        GROUP BY post_id
      ) vote_stats ON vote_stats.post_id = posts.id
      LEFT JOIN post_votes user_vote
        ON user_vote.post_id = posts.id
       AND user_vote.user_id = ?
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      `,
      [userId, userId]
    );

    res.json(rows.map(enrichPostRow));
  } catch (err) {
    console.error("Get bookmarks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBookmarkStatus = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      "SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ? LIMIT 1",
      [userId, postId]
    );

    res.json({ isBookmarked: rows.length > 0 });
  } catch (err) {
    console.error("Get bookmark status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleBookmark = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      "SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ? LIMIT 1",
      [userId, postId]
    );

    if (rows.length > 0) {
      await pool.execute("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?", [userId, postId]);
      return res.json({ isBookmarked: false });
    }

    await pool.execute(
      "INSERT INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, UTC_TIMESTAMP())",
      [userId, postId]
    );

    res.json({ isBookmarked: true });
  } catch (err) {
    console.error("Toggle bookmark error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
