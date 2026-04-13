import express from "express";
import { withMulter400, upload } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validators/authSchemas.js";
import { handleRegister, handleLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", withMulter400(upload.single("avatar")), validate(registerSchema), handleRegister); // Register a new user with optional avatar upload
router.post("/login", validate(loginSchema), handleLogin); // Authenticate user and return JWT token

export default router;