import pool from "../config/db.js";
import { sanitizeRichText } from "../utils/sanitize.js";

const parseCategories = (user) => {
  if (typeof user.categories === "string") {
    try {
      user.categories = JSON.parse(user.categories);
    } catch {
      user.categories = [];
    }
  }
  return user;
};

export const getUserByUsername = async (req, res) => {
  const { username } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      "SELECT id, username, fullname, email, bio, avatar, categories FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = parseCategories(rows[0]);
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  const { id, fullname, email, username, bio, avatar } = req.validated.body;

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
      [
        fullname.trim(),
        email.trim().toLowerCase(),
        username.trim(),
        sanitizeRichText(bio).replace(/<[^>]*>/g, "").trim(),
        avatar || null,
        id,
      ]
    );

    const [updatedUser] = await pool.execute(
      "SELECT id, username, fullname, email, bio, avatar, categories FROM users WHERE id = ?",
      [id]
    );

    const user = parseCategories(updatedUser[0]);
    res.json(user);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const saveUserCategories = async (req, res) => {
  const { userId, categories } = req.validated.body;

  try {
    await pool.execute(
      "UPDATE users SET categories = ? WHERE id = ?",
      [JSON.stringify(categories), userId]
    );

    res.json({ success: true, categories });
  } catch (err) {
    console.error("Save categories error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadUserAvatar = async (req, res) => {
  try {
    const { userId } = req.validated.body;

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
    console.error("Upload avatar error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};