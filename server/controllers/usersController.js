import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { sanitizeRichText } from "../utils/sanitize.js";
import { sendMail } from "../utils/mail.js";
import {
  createDeleteToken,
  hashDeleteToken,
  DELETE_TOKEN_EXPIRES_HOURS,
  DELETE_AFTER_DAYS,
} from "../utils/deleteAccount.js";

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
      "SELECT id, username, fullname, email, bio, avatar, categories, delete_after_at FROM users WHERE username = ?",
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
      "SELECT id, username, fullname, email, bio, avatar, categories, delete_after_at FROM users WHERE id = ?",
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

const buildDeleteLink = (token) => {
  return `${process.env.CLIENT_URL}/confirm-delete-account?token=${encodeURIComponent(token)}`;
};

export const requestAccountDeletion = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, username, fullname FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0]; 
    const token = createDeleteToken();
    const tokenHash = hashDeleteToken(token);
    
    await pool.execute(
      `
      UPDATE users
      SET delete_requested_at = UTC_TIMESTAMP(),
          delete_confirmed_at = NULL,
          delete_after_at = NULL,
          delete_token_hash = ?,
          delete_token_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR)
      WHERE id = ?
      `,
      [tokenHash, DELETE_TOKEN_EXPIRES_HOURS, userId]
    );

    const link = buildDeleteLink(token);

    await sendMail({
      to: user.email,
      subject: "Confirm your account deletion",
      text: `Hello ${user.username},\n\nWe received a request to delete your account. Open this link to confirm and enter your password:\n${link}\n\nThis link expires in 24 hours.\n\nIf you did not request this, ignore this email.`,
      html: `
        <p>Hello ${user.username},</p>
        <p>We received a request to delete your account.</p>
        <p><a href="${link}">Confirm account deletion</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not request this, ignore this email.</p>
      `,
    });

    res.json({ message: "Confirmation email sent" });
  } catch (err) {
    console.error("Request account deletion error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyDeleteAccountToken = async (req, res) => {
  const { token } = req.validated.query;

  try {
    const tokenHash = hashDeleteToken(token);

    const [rows] = await pool.execute(
      `
      SELECT id, username, fullname, avatar
      FROM users
      WHERE delete_token_hash = ?
        AND delete_token_expires_at > UTC_TIMESTAMP()
      LIMIT 1
      `,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    res.json({
      message: "Token valid",
      user: rows[0],
    });
  } catch (err) {
    console.error("Verify delete token error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const confirmDeleteAccount = async (req, res) => {
  const { token, password } = req.validated.body;

  try {
    const tokenHash = hashDeleteToken(token);

    const [rows] = await pool.execute(
      `
      SELECT id, password
      FROM users
      WHERE delete_token_hash = ?
        AND delete_token_expires_at > UTC_TIMESTAMP()
      LIMIT 1
      `,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = rows[0];
    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    await pool.execute(
      `
      UPDATE users
      SET delete_confirmed_at = UTC_TIMESTAMP(),
          delete_after_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY),
          delete_token_hash = NULL,
          delete_token_expires_at = NULL
      WHERE id = ?
      `,
      [DELETE_AFTER_DAYS, user.id]
    );

    const [updatedRows] = await pool.execute(
      "SELECT id, username, fullname, email, avatar, categories, delete_requested_at, delete_confirmed_at, delete_after_at FROM users WHERE id = ?",
      [user.id]
    );

    res.json({
      message: "Account scheduled for deletion in 7 days",
      deleteAfterDays: DELETE_AFTER_DAYS,
      user: parseCategories(updatedRows[0]),
    });
  } catch (err) {
    console.error("Confirm delete account error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelAccountDeletion = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.execute(
      `
      UPDATE users
      SET delete_requested_at = NULL,
          delete_confirmed_at = NULL,
          delete_after_at = NULL,
          delete_token_hash = NULL,
          delete_token_expires_at = NULL
      WHERE id = ?
      `,
      [userId]
    );

    res.json({ message: "Account deletion canceled" });
  } catch (err) {
    console.error("Cancel delete account error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
