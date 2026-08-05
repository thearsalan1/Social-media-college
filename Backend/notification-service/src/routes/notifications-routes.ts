import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  getNotifications,
  markOneAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../controllers/notification.controllers.js";

const router = Router();

router.get(
  "/notifications",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 100,
    prefix: "get-notifications",
  }),
  getNotifications,
);

router.get(
  "/notifications/unread-count",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 200,
    prefix: "unread-count",
  }),
  getUnreadCount,
);

router.patch("/notifications/read-all", authMiddleware, markAllAsRead);
router.patch("/notifications/:id/read", authMiddleware, markOneAsRead);
router.delete("/notifications/:id", authMiddleware, deleteNotification);

export default router;
