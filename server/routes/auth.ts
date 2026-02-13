import { RequestHandler } from "express";

// Mock database for users
const users: any[] = [];

export const handleRegister: RequestHandler = (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    return res.status(409).json({ error: "User already exists" });
  }

  // Create new user
  const newUser = { id: Date.now().toString(), email, username, password };
  users.push(newUser);

  console.log(`New user registered: ${username} (${email})`);

  res.status(201).json({ 
    message: "User registered successfully",
    user: { id: newUser.id, email, username } 
  });
};

export const handleLogin: RequestHandler = (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  res.json({ 
    message: "Login successful",
    user: { id: user.id, email: user.email, username: user.username } 
  });
};
