import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleRegister, handleLogin } from "./routes/auth";
import postsRouter from "./routes/posts.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth routes
  app.post("/api/register", handleRegister);
  app.post("/api/login", handleLogin);

  // Posts routes
  app.use("/api/posts", postsRouter);

  return app;
}
