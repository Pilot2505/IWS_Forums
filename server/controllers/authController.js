import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { sanitizeRichText } from "../utils/sanitize.js";

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
      "INSERT INTO users (username, email, password, fullname, avatar) VALUES (?, ?, ?, ?, ?)",
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
    const cleanIdentifier = identifier.trim();

    const [users] = await pool.execute(
      "SELECT id, email, username, fullname, avatar, password, delete_after_at FROM users WHERE email = ? OR LOWER(username) = LOWER(?)",
      [cleanIdentifier.toLowerCase(), cleanIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];
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