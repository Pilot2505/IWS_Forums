import express from "express";
import db from "../db.js";

const router = express.Router();

//GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT posts.*, users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET ALL POSTS BY USERNAME
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const [rows] = await db.execute(
      `
      SELECT posts.*, users.username
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
    const [rows] = await db.execute(
      `
      SELECT posts.*, users.username
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

//GET COMMENTS FOR A POST
router.get("/:id/comments", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT comments.*, users.username
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

//CREATE POST
router.post("/", async (req, res) => {
  const { title, content, userId } = req.body;

  try {
    const [result] = await db.execute(
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

//CREATE COMMENT
router.post("/:id/comments", async (req, res) => {
  try {
    const { content, user_id } = req.body;

    if (!content || !user_id) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const [result] = await db.execute(
      `
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
      `,
      [req.params.id, user_id, content]
    );

    res.status(201).json({
      id: result.insertId,
      post_id: req.params.id,
      user_id,
      content,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM posts WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//UPDATE POST
router.put("/:id", async (req, res) => {
  const { title, content } = req.body;

  try {
    const [result] = await db.execute(
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

export default router;
