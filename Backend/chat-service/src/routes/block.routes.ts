import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { blockUser, unblockUser, getBlockedUsers } from "../controllers/block.controller.js";

const router = Router();

router.post(
  "/block",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 10, prefix: "block-user" }),
  blockUser
);

router.delete("/block/:userId", authMiddleware, unblockUser);
router.get("/block", authMiddleware, getBlockedUsers);

export default router;