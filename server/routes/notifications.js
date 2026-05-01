import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { notificationIdParamsSchema } from "../validators/notificationsSchemas.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationsController.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.put("/read-all", auth, markAllNotificationsRead);
router.put("/:id/read", auth, validate(notificationIdParamsSchema), markNotificationRead);

export default router;
