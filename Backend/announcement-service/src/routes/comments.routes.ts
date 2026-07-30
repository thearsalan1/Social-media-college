import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { checkOwnership } from "../middlewares/checkOwnership.middleware.js";
import { sanitizeInput } from "../middlewares/sanatizeInput.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { createCommentSchema } from "../validator/announcement.validator.js";
import {
  createComment,
  getAllCommentsOnAnnouncement,
  deleteComment,
} from "../controllers/comments.controller.js";

const router = Router();

router.post(
  "/announcements/:id/comment",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 20,
    prefix: "create-announcement-comment",
  }),
  sanitizeInput(["content"]),
  validate(createCommentSchema),
  createComment,
);

router.get(
  "/announcements/:id/comment",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 200,
    prefix: "browse",
  }),
  getAllCommentsOnAnnouncement,
);

router.delete("/announcements/comment/:id", authMiddleware, deleteComment);

export default router;
