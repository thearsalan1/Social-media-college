import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { toggleLike } from "../controllers/LikeController.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post(
  "/like",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 100,
    prefix: "like-toggle",
  }),
  toggleLike,
);
export default router;
