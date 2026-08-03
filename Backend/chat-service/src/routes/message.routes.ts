import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { sanitizeInput } from "../middlewares/sanitizeInput.middleware.js";
import {
  sendMessage,
  getMessages,
  markAsRead,
  editMessage,
  deleteMessage,
} from "../controllers/message.controller.js";
import { uploadChatImage } from "../config/multer.js";

const router = Router();

router.post(
  "/messages",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 60,
    prefix: "send-message",
  }),
   uploadChatImage.single("image"), 
  sanitizeInput(["content"]),
  sendMessage,
);

router.get(
  "/messages/:conversationId",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 200,
    prefix: "browse",
  }),
  getMessages,
);

router.patch("/messages/:conversationId/read", authMiddleware, markAsRead);

router.patch(
  "/messages/:id",
  authMiddleware,
  sanitizeInput(["content"]),
  editMessage,
);

router.delete("/messages/:id", authMiddleware, deleteMessage);

export default router;
