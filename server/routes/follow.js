import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  followSchema,
  unfollowSchema,
  seenSchema,
  followCountSchema,
  isFollowingSchema,
} from "../validators/followSchemas.js";
import {
  followUser,
  unfollowUser,
  getFollowCount,
  isFollowing,
  getFollowingUsers,
  updateLastSeen,
} from "../controllers/followController.js";

const router = express.Router();

router.post("/", auth, validate(followSchema), followUser); // Follow a user
router.delete("/", auth, validate(unfollowSchema), unfollowUser); // Unfollow a user
router.get("/follow-count/:userId", auth, validate(followCountSchema), getFollowCount); // Get followers and following count
router.get("/is-following", auth, validate(isFollowingSchema), isFollowing); // Check if a user is following another user
router.get("/:userId", auth, validate(followCountSchema), getFollowingUsers); // Get list of users that a user is following
router.put("/seen", auth, validate(seenSchema), updateLastSeen); // Update last seen timestamp

export default router;