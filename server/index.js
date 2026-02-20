import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleRegister, handleLogin } from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import followsRouter from "./routes/follow.js";
import usersRouter from "./routes/users.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth routes
  app.post("/api/register", handleRegister);
  app.post("/api/login", handleLogin);

  // User routes
  app.use("/api/users", usersRouter);

  // Posts routes
  app.use("/api/posts", postsRouter);

  // Follow routes
  app.use("/api/follow", followsRouter);

  return app;
}
