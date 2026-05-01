import express from "express";
import { withMulter400, upload } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import {
	registerSchema,
	loginSchema,
	forgotPasswordRequestSchema,
	forgotPasswordVerifySchema,
	resetPasswordSchema,
} from "../validators/authSchemas.js";
import {
	handleRegister,
	handleLogin,
	handleForgotPasswordRequest,
	handleForgotPasswordVerify,
	handleResetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", withMulter400(upload.single("avatar")), validate(registerSchema), handleRegister); // Register a new user with optional avatar upload
router.post("/login", validate(loginSchema), handleLogin); // Authenticate user and return JWT token
router.post("/forgot-password", validate(forgotPasswordRequestSchema), handleForgotPasswordRequest); // Send a password reset link
router.get("/forgot-password/verify", validate(forgotPasswordVerifySchema), handleForgotPasswordVerify); // Verify password reset token
router.post("/forgot-password/reset", validate(resetPasswordSchema), handleResetPassword); // Reset password using a token

export default router;