import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { bookmarkPostParamsSchema } from "../validators/bookmarksSchemas.js";
import {
  getBookmarks,
  getBookmarkStatus,
  toggleBookmark,
} from "../controllers/bookmarksController.js";

const router = express.Router();

router.get("/", auth, getBookmarks);
router.get("/status/:postId", auth, validate(bookmarkPostParamsSchema), getBookmarkStatus);
router.post("/:postId/toggle", auth, validate(bookmarkPostParamsSchema), toggleBookmark);

export default router;
