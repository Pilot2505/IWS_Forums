import express from "express";
import pool from "../db.js";
import auth from "../middlewares/authMiddleware.js";
import { createUploadHandler } from "../middlewares/upload.js";

const router = express.Router();
const postImageUpload = createUploadHandler("post-images");

//GET ALL POSTS
router.get("/", auth, async (req, res) => {
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
      LIMIT ${limit} OFFSET ${offset}
      `);

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

//SEARCH POSTS BY TITLE OR CONTENT
router.get("/search", auth, async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q.trim()) {
      return res.json([]);
    }

    const keyword = `%${q.trim()}%`;

    const [rows] = await pool.execute(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.title LIKE ? OR posts.content LIKE ?
      ORDER BY posts.created_at DESC
      LIMIT 50
      `,
      [keyword, keyword]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET RECOMMENDED POSTS BY CATEGORIES
// categories được truyền qua query string: ?categories=javascript,python,web
router.get("/recommended", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const rawCats = req.query.categories || "";
    const categories = rawCats
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (categories.length === 0) {
      return res.status(400).json({ message: "No categories provided" });
    }

    // Map category id -> keywords để tìm trong title/content
    const categoryKeywords = {
      javascript: ["javascript", "js", "node", "react", "vue", "angular", "typescript"],
      python: ["python", "django", "flask", "fastapi", "pandas", "numpy"],
      java: ["java", "spring", "maven", "gradle", "jvm", "kotlin"],
      cpp: ["c++", "cpp", "c language", "pointer", "memory management"],
      web: ["html", "css", "web", "frontend", "backend", "http", "api", "rest"],
      mobile: ["mobile", "android", "ios", "flutter", "react native", "swift"],
      database: ["sql", "mysql", "postgresql", "mongodb", "database", "nosql", "redis"],
      devops: ["devops", "docker", "kubernetes", "ci/cd", "jenkins", "nginx", "linux"],
      ai_ml: ["ai", "machine learning", "deep learning", "neural", "tensorflow", "pytorch", "llm"],
      security: ["security", "cybersecurity", "encryption", "firewall", "vulnerability", "hacking"],
      cloud: ["aws", "azure", "gcp", "cloud", "serverless", "s3", "lambda"],
      opensource: ["open source", "github", "git", "contribution", "license"],
    };

    // Gom tất cả keywords từ các categories được chọn
    const keywords = categories.flatMap((cat) => categoryKeywords[cat] || [cat]);

    if (keywords.length === 0) {
      return res.status(400).json({ message: "Invalid categories" });
    }

    // Tạo điều kiện LIKE cho từng keyword
    const conditions = keywords.map(() => "(posts.title LIKE ? OR posts.content LIKE ?)").join(" OR ");
    const params = keywords.flatMap((kw) => [`%${kw}%`, `%${kw}%`]);

    // Đếm tổng
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM posts JOIN users ON posts.user_id = users.id WHERE ${conditions}`,
      params
    );
    const totalPosts = countRows[0].total;
    const totalPages = Math.ceil(totalPosts / limit);

    // Lấy bài viết recommended có phân trang
    const [rows] = await pool.query(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE ${conditions}
      ORDER BY posts.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    res.json({ posts: rows, currentPage: page, totalPages, totalPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET ALL POSTS BY USERNAME
router.get("/user/:username", auth, async (req, res) => {
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
router.get("/:id", auth, async (req, res) => {
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
router.post("/", auth, async (req, res) => {
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

// Image upload endpoint for TinyMCE
router.post("/upload-image", auth, postImageUpload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imageUrl = `/post-images/${req.file.filename}`;
    res.json({
      location: imageUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Image upload failed", details: err.message });
  }
});

//DELETE POST
router.delete("/:id", auth, async (req, res) => {
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
router.put("/:id", auth, async (req, res) => {
  const { title, content } = req.body;

  // Validate title and content
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (!content || !content.trim() || content === "<p><br></p>") {
    return res.status(400).json({ message: "Content is required" });
  }

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
router.get("/:id/comments", auth, async (req, res) => {
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
router.post("/:id/comments", auth, async (req, res) => {
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
router.delete("/comments/:id", auth, async (req, res) => {
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
