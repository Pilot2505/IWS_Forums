import express from "express";
import { withMulter400, upload } from "../middlewares/upload.js";
import auth from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  updateProfileSchema,
  categoriesSchema,
  uploadAvatarSchema,
  usernameParamsSchema,
  requestDeleteAccountSchema,
  verifyDeleteAccountTokenSchema,
  confirmDeleteAccountSchema,
  cancelDeleteAccountSchema,
} from "../validators/usersSchemas.js";
import {
  getUserByUsername,
  updateUserProfile,
  saveUserCategories,
  uploadUserAvatar,
  requestAccountDeletion,
  verifyDeleteAccountToken,
  confirmDeleteAccount,
  cancelAccountDeletion,
} from "../controllers/usersController.js";

const router = express.Router();

router.get("/:username", auth, validate(usernameParamsSchema), getUserByUsername); // Get user profile by username
router.put("/update-profile", auth, validate(updateProfileSchema), updateUserProfile); // Update user profile (fullname, email, username, bio, avatar)
router.put("/categories", auth, validate(categoriesSchema), saveUserCategories); // Save user's interested categories
router.post("/upload-avatar", auth, withMulter400(upload.single("avatar")), validate(uploadAvatarSchema), uploadUserAvatar); // Upload user avatar

router.post("/delete-account/request", auth, validate(requestDeleteAccountSchema), requestAccountDeletion); // Request account deletion (send email with token)
router.get("/delete-account/verify", validate(verifyDeleteAccountTokenSchema), verifyDeleteAccountToken); // Verify delete account token (check if token is valid and not expired)
router.post("/delete-account/confirm", validate(confirmDeleteAccountSchema), confirmDeleteAccount); // Confirm account deletion (delete user after confirmation)
router.post("/delete-account/cancel", auth, validate(cancelDeleteAccountSchema), cancelAccountDeletion); // Cancel account deletion (remove deletion request)
export default router;