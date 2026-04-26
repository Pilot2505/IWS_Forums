import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarsDir = path.resolve(__dirname, "../uploads/avatars");

async function removeAvatarFile(avatarPath) {
  if (!avatarPath || !avatarPath.startsWith("/avatars/")) {
    return;
  }

  const fileName = avatarPath.replace("/avatars/", "");
  const filePath = path.join(avatarsDir, fileName);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to remove avatar file:", filePath, err);
    }
  }
}

export async function runAccountDeletionCleanup() {
  const [rows] = await pool.query(
    `
    SELECT id, avatar
    FROM users
    WHERE delete_after_at IS NOT NULL
      AND delete_after_at <= UTC_TIMESTAMP()
    `
  );

  if (rows.length === 0) {
    return;
  }

  const userIds = rows.map((row) => row.id);

  await pool.query("DELETE FROM users WHERE id IN (?)", [userIds]);

  await Promise.all(rows.map((row) => removeAvatarFile(row.avatar)));
}

export function startAccountDeletionCleanup() {
  runAccountDeletionCleanup().catch((err) => {
    console.error("Initial account deletion cleanup failed:", err);
  });

  setInterval(() => {
    runAccountDeletionCleanup().catch((err) => {
      console.error("Scheduled account deletion cleanup failed:", err);
    });
  }, 24 * 60 * 60 * 1000);
}