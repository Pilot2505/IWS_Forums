import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import followsRouter from "./routes/follow.js";
import usersRouter from "./routes/users.js";
import bookmarksRouter from "./routes/bookmarks.js";
import notificationsRouter from "./routes/notifications.js";

export function createServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  // Add Content Security Policy to mitigate XSS risks
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:8080"],
      },
    })
  );

  // Middleware
  app.use(cors({origin: "http://localhost:8080"}));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/avatars", express.static("uploads/avatars"));
  app.use("/post-images", express.static("uploads/post-images"));


  app.use("/api", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/follow", followsRouter);
  app.use("/api/bookmarks", bookmarksRouter);
  app.use("/api/notifications", notificationsRouter);

  return app;
}
