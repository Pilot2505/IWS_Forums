import express from "express";
import pool from "../db.js";

const router = express.Router();

// Follow
router.post("/", async (req, res) => {
  const { followerId, followingId } = req.body;

  if (!followerId || !followingId)
    return res.status(400).json({ message: "Missing data" });

  if (followerId === followingId)
    return res.status(400).json({ message: "Cannot follow yourself" });

  try {
    await pool.execute(
      `INSERT INTO followers (follower_id, following_id, last_seen)
       VALUES (?, ?, NOW())`,
      [followerId, followingId]
    );

    res.json({ isFollowing: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.json({ isFollowing: true });
    }
    res.status(500).json({ error: err.message });
  }
});

// Unfollow
router.delete("/", async (req, res) => {
  const { followerId, followingId } = req.body;

  await pool.execute(
    `DELETE FROM followers
     WHERE follower_id = ? AND following_id = ?`,
    [followerId, followingId]
  );

  res.json({ isFollowing: false });
});

// Follow count
router.get("/follow-count/:userId", async (req, res) => {
  const { userId } = req.params;

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
      following: following[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if following
router.get("/is-following", async (req, res) => {
  const { followerId, followingId } = req.query;

  const [rows] = await pool.execute(
    "SELECT * FROM followers WHERE follower_id = ? AND following_id = ?",
    [followerId, followingId]
  );

  res.json({ isFollowing: rows.length > 0 });
});

// Get following users with new posts count
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

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
      GROUP BY u.id, u.username
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update last seen
router.put("/seen", async (req, res) => {
  const { followerId, followingId } = req.body;

  try {
    await pool.execute(
      `
      UPDATE followers
      SET last_seen = NOW()
      WHERE follower_id = ? AND following_id = ?
      `,
      [followerId, followingId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;