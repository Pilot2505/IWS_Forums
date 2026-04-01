import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

export const handleRegister = async (req, res) => {
  const { email, username, password, fullname } = req.body;
  const avatar = req.file ? `/avatars/${req.file.filename}` : null;

  if (!email || !username || !password || !fullname) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Validate email format
    const normalizedEmail = validator.normalizeEmail(email);
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate username (alphanumeric only)
    const trimmedUsername = username.trim();
    if (!validator.isAlphanumeric(trimmedUsername)) {
      return res.status(400).json({ error: "Username must be alphanumeric" });
    }

    // Validate password length
    if (!validator.isLength(password, { min: 6 })) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Normalize and clean inputs
    const cleanEmail = normalizedEmail;
    const cleanUsername = trimmedUsername;
    const cleanFullname = fullname.trim();

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [cleanEmail, cleanUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Username or email already exists" });
    }


    // Hash the password for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user in the database
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, fullname, avatar) VALUES (?, ?, ?, ?, ?)",
      [cleanUsername, cleanEmail, hashedPassword, cleanFullname, avatar]
    );

    const userId = result.insertId;
    console.log(`New user registered in DB: ${cleanUsername} (${cleanEmail})`);

    // create access token
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ 
      message: "User registered successfully",
      token: accessToken,
      user: { id: userId, email: cleanEmail, username: cleanUsername, fullname: cleanFullname } 
    });
  } catch (error) {
    console.error("Database registration error:", error);
    res.status(500).json({ error: "Internal server error during registration" });
  }
};

export const handleLogin = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Missing username/email or password" });
  }

  try {
    // Sanitize the identifier input
    const cleanIdentifier = identifier.trim().toLowerCase();

    // Find the user by username
    const [users] = await pool.execute(
      "SELECT id, email, username, fullname, avatar, password FROM users WHERE email = ? OR username = ?",
      [cleanIdentifier, cleanIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // create access token
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
        avatar: user.avatar || null
      } 
    });
  } catch (error) {
    console.error("Database login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};
