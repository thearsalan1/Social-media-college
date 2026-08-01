import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  startDM,
  startMarketPlaceChat,
  getConversations,
  getRequests,
  getConversationId,
  acceptRequest,
  archiveConversation,
  unarchiveConversation,
} from "../controllers/conversation.controllers.js";

const router = Router();

router.post(
  "/conversations/dm",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 10, prefix: "start-dm" }),
  startDM
);

router.post(
  "/conversations/marketplace",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 20, prefix: "start-marketplace-chat" }),
  startMarketPlaceChat
);

router.get(
  "/conversations/requests",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 200, prefix: "browse" }),
  getRequests
);

router.get(
  "/conversations/:id",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 200, prefix: "browse" }),
  getConversationId
);

router.get(
  "/conversations",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 200, prefix: "browse" }),
  getConversations
);

router.patch(
  "/conversations/:id/accept",
  authMiddleware,
  acceptRequest
);

router.patch(
  "/conversations/:id/archive",
  authMiddleware,
  archiveConversation
);

router.patch(
  "/conversations/:id/unarchive",
  authMiddleware,
  unarchiveConversation
);

export default router;