import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleRegister, handleLogin } from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import followsRouter from "./routes/follow.js";
import usersRouter from "./routes/users.js";
import { upload } from "./middlewares/upload.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/avatars", express.static("public/avatars"));

  // Auth routes
  app.post("/api/register", upload.single("avatar"), handleRegister);
  app.post("/api/login", handleLogin);

  // User routes
  app.use("/api/users", usersRouter);

  // Posts routes
  app.use("/api/posts", postsRouter);

  // Follow routes
  app.use("/api/follow", followsRouter);

  return app;
}
