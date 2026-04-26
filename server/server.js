import { createServer } from "./index.js";
import { startAccountDeletionCleanup } from "./jobs/accountDeletionCleanup.js";

const app = createServer();

const PORT = 3000;

startAccountDeletionCleanup();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

