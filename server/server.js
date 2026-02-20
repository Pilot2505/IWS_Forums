import { createServer } from "./index.js";

const app = createServer();

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

