import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensurePostVotesTable = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS post_votes (
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        vote TINYINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CHECK (vote IN (-1, 1))
      ) ENGINE=InnoDB;
    `);
  } finally {
    connection.release();
  }
};

export const dbReady = (async () => {
  const maxRetries = 30;
  const retryDelayMs = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await ensurePostVotesTable();
      const connection = await pool.getConnection();
      connection.release();
      console.log("MySQL connected successfully");
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.error("MySQL connection failed:", err);
        throw err;
      }

      await delay(retryDelayMs);
    }
  }
})();

export default pool;
