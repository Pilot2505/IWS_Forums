import pool from "../config/db.js";
import { sanitizeRichText } from "../utils/sanitize.js";

export const getPosts = async (req, res) => {
  const { page, limit } = req.validated.query;
  const offset = (page - 1) * limit;

  try {
    const [countRows] = await pool.execute("SELECT COUNT(*) as total FROM posts");
    const totalPosts = countRows[0].total;
    const totalPages = Math.ceil(totalPosts / limit);

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
};

export const searchPosts = async (req, res) => {
  const { q } = req.validated.query;

  try {
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
};

export const getRecommendedPosts = async (req, res) => {
  const { page, limit, categories } = req.validated.query;
  const offset = (page - 1) * limit;

  try {
    const categoryList = categories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

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

    const keywords = categoryList.flatMap((cat) => categoryKeywords[cat] || [cat]);

    if (keywords.length === 0) {
      return res.status(400).json({ message: "Invalid categories" });
    }

    const conditions = keywords.map(() => "(posts.title LIKE ? OR posts.content LIKE ?)").join(" OR ");
    const params = keywords.flatMap((kw) => [`%${kw}%`, `%${kw}%`]);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM posts JOIN users ON posts.user_id = users.id WHERE ${conditions}`,
      params
    );

    const totalPosts = countRows[0].total;
    const totalPages = Math.ceil(totalPosts / limit);

    const [rows] = await pool.query(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE ${conditions}
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({ posts: rows, currentPage: page, totalPages, totalPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostsByUsername = async (req, res) => {
  const { username } = req.validated.params;

  try {
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
};

export const getPostById = async (req, res) => {
  const { id } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createPost = async (req, res) => {
  const { title, content, userId } = req.validated.body;

  try {
    const safeTitle = title.trim();
    const safeContent = sanitizeRichText(content);

    const [result] = await pool.execute(
      "INSERT INTO posts (title, content, user_id, created_at) VALUES (?, ?, ?, NOW())",
      [safeTitle, safeContent, userId]
    );

    res.status(201).json({
      id: result.insertId,
      title: safeTitle,
      content: safeContent,
      user_id: userId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const uploadPostImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    res.json({
      location: `/post-images/${req.file.filename}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Image upload failed", details: err.message });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.validated.params;

  try {
    const [result] = await pool.execute(
      "DELETE FROM posts WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  const { title, content } = req.validated.body;
  const { id } = req.validated.params;

  try {
    const safeTitle = title.trim();
    const safeContent = sanitizeRichText(content);

    const [result] = await pool.execute(
      "UPDATE posts SET title = ?, content = ? WHERE id = ?",
      [safeTitle, safeContent, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommentsByPostId = async (req, res) => {
  const { id } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT comments.*, users.username, users.avatar
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createComment = async (req, res) => {
  const { content, user_id, parent_id } = req.validated.body;
  const { id: postId } = req.validated.params;

  try {
    const safeContent = sanitizeRichText(content);

    const [result] = await pool.execute(
      `
      INSERT INTO comments (post_id, user_id, content, parent_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [postId, user_id, safeContent, parent_id || null]
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
};

export const deleteComment = async (req, res) => {
  const { id: commentId } = req.validated.params;
  const { userId } = req.validated.body;

  try {
    const [rows] = await pool.execute(
      `
      SELECT comments.user_id AS commentOwner,
             posts.user_id AS postOwner
      FROM comments
      JOIN posts ON comments.post_id = posts.id
      WHERE comments.id = ?
      `,
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { commentOwner, postOwner } = rows[0];

    if (commentOwner !== userId && postOwner !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await pool.execute("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({ message: "Comment deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};