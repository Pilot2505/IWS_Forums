import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { sanitizeRichText } from "../utils/sanitize.js";
import { sendMail } from "../utils/mail.js";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_EXPIRES_HOURS,
} from "../utils/passwordReset.js";

const findUserByIdentifier = async (identifier, fields) => {
  const cleanIdentifier = String(identifier || "").trim();
  const emailCandidate = validator.isEmail(cleanIdentifier)
    ? validator.normalizeEmail(cleanIdentifier) || cleanIdentifier.toLowerCase()
    : cleanIdentifier.toLowerCase();

  const [rows] = await pool.execute(
    `SELECT ${fields} FROM users WHERE email = ? OR LOWER(username) = LOWER(?) LIMIT 1`,
    [emailCandidate, cleanIdentifier]
  );

  return rows[0] || null;
};

const findUserByPasswordResetToken = async (token) => {
  const tokenHash = hashPasswordResetToken(token);

  const [rows] = await pool.execute(
    `
    SELECT id
    FROM users
    WHERE password_reset_token_hash = ?
      AND password_reset_token_expires_at > UTC_TIMESTAMP()
    LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
};

const buildPasswordResetLink = (token) => {
  return `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
};

export const handleRegister = async (req, res) => {
  const { email, username, password, fullname } = req.validated.body;
  const avatar = req.file ? `/avatars/${req.file.filename}` : null;

  try {
    const normalizedEmail = validator.normalizeEmail(email);
    const trimmedUsername = username.trim();
    const cleanFullname = sanitizeRichText(fullname).replace(/<[^>]*>/g, "").trim();

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [normalizedEmail, trimmedUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, fullname, avatar, created_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())",
      [trimmedUsername, normalizedEmail, hashedPassword, cleanFullname, avatar]
    );

    const userId = result.insertId;

    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: "User registered successfully",
      token: accessToken,
      user: {
        id: userId,
        email: normalizedEmail,
        username: trimmedUsername,
        fullname: cleanFullname,
      },
    });
  } catch (error) {
    console.error("Database registration error:", error);
    res.status(500).json({ error: "Internal server error during registration" });
  }
};

export const handleLogin = async (req, res) => {
  const { identifier, password } = req.validated.body;

  try {
    const user = await findUserByIdentifier(
      identifier,
      "id, email, username, fullname, avatar, password, delete_after_at"
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullname: user.fullname,
        avatar: user.avatar || null,
        delete_after_at: user.delete_after_at || null,
      },
    });
  } catch (error) {
    console.error("Database login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};

export const handleForgotPasswordRequest = async (req, res) => {
  const { identifier } = req.validated.body;

  try {
    const user = await findUserByIdentifier(identifier, "id, email, username, fullname");

    if (user) {
      const token = createPasswordResetToken();
      const tokenHash = hashPasswordResetToken(token);
      const resetLink = buildPasswordResetLink(token);

      await pool.execute(
        `
        UPDATE users
        SET password_reset_token_hash = ?,
            password_reset_token_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR)
        WHERE id = ?
        `,
        [tokenHash, PASSWORD_RESET_TOKEN_EXPIRES_HOURS, user.id]
      );

      const expiresText = `${PASSWORD_RESET_TOKEN_EXPIRES_HOURS} hour${
        PASSWORD_RESET_TOKEN_EXPIRES_HOURS === 1 ? "" : "s"
      }`;

      await sendMail({
        to: user.email,
        subject: "Reset your Tech Pulse password",
        text: `Hello ${user.username},\n\nWe received a request to reset your Tech Pulse password. Use the link below to choose a new password:\n${resetLink}\n\nThis link expires in ${expiresText}.\n\nIf you did not request this reset, you can safely ignore this email.`,
        html: `
          <p>Hello ${user.username},</p>
          <p>We received a request to reset your Tech Pulse password.</p>
          <p>Use the link below to choose a new password.</p>
          <p><a href="${resetLink}">Reset password</a></p>
          <p>This link expires in ${expiresText}.</p>
          <p>If you did not request this reset, you can safely ignore this email.</p>
        `,
      });
    }

    res.json({
      message: "Password reset email has been sent.",
    });
  } catch (error) {
    console.error("Forgot password request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleForgotPasswordVerify = async (req, res) => {
  const { token } = req.validated.query;

  try {
    const user = await findUserByPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    res.json({ message: "Token valid" });
  } catch (error) {
    console.error("Forgot password verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleResetPassword = async (req, res) => {
  const { token, password } = req.validated.body;

  try {
    const user = await findUserByPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      `
      UPDATE users
      SET password = ?,
          password_reset_token_hash = NULL,
          password_reset_token_expires_at = NULL
      WHERE id = ?
      `,
      [hashedPassword, user.id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};