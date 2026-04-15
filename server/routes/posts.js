import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { createUploadHandler, withMulter400 } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import {
  postsListSchema,
  searchSchema,
  recommendedSchema,
  postIdParamsSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  deleteCommentSchema,
  votePostSchema,
} from "../validators/postsSchemas.js";
import { usernameParamsSchema } from "../validators/usersSchemas.js";
import {
  getPosts,
  searchPosts,
  getRecommendedPosts,
  getPostsByUsername,
  getPostById,
  createPost,
  uploadPostImage,
  deletePost,
  updatePost,
  getCommentsByPostId,
  createComment,
  deleteComment,
  togglePostVote,
} from "../controllers/postsController.js";

const router = express.Router();
const postImageUpload = createUploadHandler("post-images");

router.get("/", auth, validate(postsListSchema), getPosts); // Get list of posts with pagination and optional category filter
router.get("/search", auth, validate(searchSchema), searchPosts); // Search posts by keyword in title or content
router.get("/recommended", auth, validate(recommendedSchema), getRecommendedPosts); // Get recommended posts based on user's followed categories
router.get("/user/:username", auth, validate(usernameParamsSchema), getPostsByUsername); // Get posts by username
router.get("/:id", auth, validate(postIdParamsSchema), getPostById); // Get post details by ID, including comments and author info
router.post("/", auth, validate(createPostSchema), createPost); // Create a new post
router.post("/upload-image", auth, withMulter400(postImageUpload.single("image")), uploadPostImage); // Upload an image for a post
router.delete("/:id", auth, validate(postIdParamsSchema), deletePost); // Delete a post
router.put("/:id", auth, validate(updatePostSchema), updatePost); // Update a post
router.post("/:id/vote", auth, validate(votePostSchema), togglePostVote); // Toggle upvote/downvote for a post
router.get("/:id/comments", auth, validate(postIdParamsSchema), getCommentsByPostId); // Get comments for a specific post
router.post("/:id/comments", auth, validate(createCommentSchema), createComment); // Create a new comment
router.delete("/comments/:id", auth, validate(deleteCommentSchema), deleteComment); // Delete a comment

export default router;
