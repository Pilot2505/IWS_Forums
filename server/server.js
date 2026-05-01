import { createServer } from "./index.js";
import { dbReady } from "./config/db.js";
import { startAccountDeletionCleanup } from "./jobs/accountDeletionCleanup.js";

const app = createServer();

const PORT = 3000;

try {
  await dbReady;
  startAccountDeletionCleanup();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Server failed to start because MySQL is unavailable.", err);
  process.exit(1);
}

