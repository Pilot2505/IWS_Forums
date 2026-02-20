import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/:username", async (req, res) => {
  const { username } = req.params;

  const [rows] = await db.execute(
    "SELECT id, username FROM users WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(rows[0]);
});

export default router;
