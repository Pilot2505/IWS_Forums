import pool from "../config/db.js";
import { createNotification } from "../utils/notifications.js";

export const followUser = async (req, res) => {
  const { followerId, followingId } = req.validated.body;

  try {
    await pool.execute(
      `
      INSERT INTO followers (follower_id, following_id, last_seen)
      VALUES (?, ?, UTC_TIMESTAMP())
      `,
      [followerId, followingId]
    );

    await createNotification({
      userId: followingId,
      actorUserId: followerId,
      type: "follow",
      message: "started following you",
    });

    res.json({ isFollowing: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.json({ isFollowing: true });
    }

    console.error("Follow error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const unfollowUser = async (req, res) => {
  const { followerId, followingId } = req.validated.body;

  try {
    await pool.execute(
      `
      DELETE FROM followers
      WHERE follower_id = ? AND following_id = ?
      `,
      [followerId, followingId]
    );

    res.json({ isFollowing: false });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFollowCount = async (req, res) => {
  const { userId } = req.validated.params;

  try {
    const [followers] = await pool.execute(
      "SELECT COUNT(*) AS count FROM followers WHERE following_id = ?",
      [userId]
    );

    const [following] = await pool.execute(
      "SELECT COUNT(*) AS count FROM followers WHERE follower_id = ?",
      [userId]
    );

    res.json({
      followers: followers[0].count,
      following: following[0].count,
    });
  } catch (err) {
    console.error("Follow count error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const isFollowing = async (req, res) => {
  const { followerId, followingId } = req.validated.query;

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM followers WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );

    res.json({ isFollowing: rows.length > 0 });
  } catch (err) {
    console.error("Is following error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFollowingUsers = async (req, res) => {
  const { userId } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT 
          u.id,
          u.username,
          u.fullname,
          u.avatar,
          COUNT(p.id) AS newPosts
      FROM followers f
      JOIN users u 
          ON f.following_id = u.id
      LEFT JOIN posts p 
          ON p.user_id = u.id
          AND p.created_at > COALESCE(f.last_seen, '1970-01-01')
      WHERE f.follower_id = ?
      GROUP BY u.id, u.username, u.fullname, u.avatar
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get following users error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateLastSeen = async (req, res) => {
  const { followerId, followingId } = req.validated.body;

  try {
    const [result] = await pool.execute(
      `
      UPDATE followers
      SET last_seen = UTC_TIMESTAMP()
      WHERE follower_id = ? AND following_id = ?
      `,
      [followerId, followingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Follow relation not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Update seen error:", err);
    res.status(500).json({ error: "Server error" });
  }
};