import express from "express";
import { upload } from "../middlewares/upload.js";
import pool from "../db.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

//GET USER BY USERNAME
router.get("/:username", auth, async (req, res) => {
  const { username } = req.params;

  const [rows] = await pool.execute(
    "SELECT id, username, fullname, email, bio, avatar, categories FROM users WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = rows[0];

  // Parse categories nếu là string JSON
  if (typeof user.categories === "string") {
    try {
      user.categories = JSON.parse(user.categories);
    } catch {
      user.categories = [];
    }
  }

  res.json(user);
});

//UPDATE USER PROFILE
router.put("/update-profile", auth, async (req, res) => {
  const { id, fullname, email, username, bio, avatar } = req.body;

  if (!id || !fullname || !email || !username) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?",
      [email, username, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    await pool.execute(
      "UPDATE users SET fullname = ?, email = ?, username = ?, bio = ?, avatar = ? WHERE id = ?",
      [fullname, email, username, bio || "", avatar || null, id]
    );

    const [updatedUser] = await pool.execute(
      "SELECT id, username, fullname, email, bio, avatar, categories FROM users WHERE id = ?",
      [id]
    );

    const user = updatedUser[0];
    if (typeof user.categories === "string") {
      try { user.categories = JSON.parse(user.categories); } catch { user.categories = []; }
    }

    res.json(user);

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//SAVE CATEGORIES
router.put("/categories", auth, async (req, res) => {
  const { userId, categories } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  if (!Array.isArray(categories)) {
    return res.status(400).json({ message: "Categories must be an array" });
  }

  // Giới hạn tối đa 3 categories
  const limited = categories.slice(0, 3);

  try {
    await pool.execute(
      "UPDATE users SET categories = ? WHERE id = ?",
      [JSON.stringify(limited), userId]
    );

    res.json({ success: true, categories: limited });
  } catch (err) {
    console.error("Save categories error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//CHANGE AVATAR
router.post("/upload-avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const avatarPath = `/avatars/${req.file.filename}`;

    await pool.execute(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [avatarPath, userId]
    );

    res.json({ avatar: avatarPath });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
