import express from "express";
import pool from "../db.js";

const router = express.Router();

//GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    //Get total posts count
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) as total FROM posts"
    );
    const totalPosts = countRows[0].total;
    const totalPages = Math.ceil(totalPosts / limit);

    //Get paginated posts
    const [rows] = await pool.execute(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    res.json({
      posts: rows,
      currentPage: page,
      totalPages,
      totalPosts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET ALL POSTS BY USERNAME
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE users.username = ?
      ORDER BY posts.created_at DESC
      `,
      [username]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET SINGLE POST
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//CREATE POST
router.post("/", async (req, res) => {
  const { title, content, userId } = req.body;

  try {
    const [result] = await pool.execute(
      "INSERT INTO posts (title, content, user_id, created_at) VALUES (?, ?, ?, NOW())",
      [title, content, userId]
    );

    res.status(201).json({
      id: result.insertId,  
      title,
      content,
      user_id: userId,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM posts WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//UPDATE POST
router.put("/:id", async (req, res) => {
  const { title, content } = req.body;

  try {
    const [result] = await pool.execute(
      "UPDATE posts SET title = ?, content = ? WHERE id = ?",
      [title, content, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
})

//GET COMMENTS
router.get("/:id/comments", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT comments.*, users.username, users.avatar
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC
      `,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//CREATE COMMENT
router.post("/:id/comments", async (req, res) => {
  try {
    const { content, user_id, parent_id } = req.body;

    if (!content || !user_id) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO comments (post_id, user_id, content, parent_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [req.params.id, user_id, content, parent_id || null]
    );

    const [rows] = await pool.execute(
      `
      SELECT comments.*, users.username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//DELETE COMMENT
router.delete("/comments/:id", async (req, res) => {
  try {
    const commentId = req.params.id;
    const { userId } = req.body;

    const [rows] = await pool.execute(`
      SELECT comments.user_id AS commentOwner,
             posts.user_id AS postOwner
      FROM comments
      JOIN posts ON comments.post_id = posts.id
      WHERE comments.id = ?
    `, [commentId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { commentOwner, postOwner } = rows[0];

    //Check if user is comment owner or post owner
    if (commentOwner !== userId && postOwner !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await pool.execute("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({ message: "Comment deleted successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
