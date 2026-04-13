import express from "express";
import { withMulter400, upload } from "../middlewares/upload.js";
import auth from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  updateProfileSchema,
  categoriesSchema,
  uploadAvatarSchema,
  usernameParamsSchema,
} from "../validators/usersSchemas.js";
import {
  getUserByUsername,
  updateUserProfile,
  saveUserCategories,
  uploadUserAvatar,
} from "../controllers/usersController.js";

const router = express.Router();

router.get("/:username", auth, validate(usernameParamsSchema), getUserByUsername); // Get user profile by username
router.put("/update-profile", auth, validate(updateProfileSchema), updateUserProfile); // Update user profile (fullname, email, username, bio, avatar)
router.put("/categories", auth, validate(categoriesSchema), saveUserCategories); // Save user's interested categories
router.post("/upload-avatar", auth, withMulter400(upload.single("avatar")), validate(uploadAvatarSchema), uploadUserAvatar); // Upload user avatar

export default router;