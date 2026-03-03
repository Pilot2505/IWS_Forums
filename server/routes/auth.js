import pool from "../db.js";
import bcrypt from "bcrypt";

export const handleRegister = async (req, res) => {
  const { email, username, password, fullname } = req.body;
  const avatar = req.file ? `/avatars/${req.file.filename}` : null;

  if (!email || !username || !password || !fullname) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash the password for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user in the database
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, fullname, avatar) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, fullname, avatar]
    );

    const userId = result.insertId;
    console.log(`New user registered in DB: ${username} (${email})`);

    res.status(201).json({ 
      message: "User registered successfully",
      user: { id: userId, email, username, fullname } 
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
    // Find the user by username
    const [users] = await pool.execute(
      "SELECT id, email, username, fullname, avatar, password FROM users WHERE email = ? OR username = ?",
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({ 
      message: "Login successful",
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
