import { Router } from "express";
import { signup } from "../controllers/auth.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post(
  "/sign-up",
  createRateLimiter({ windowInSeconds: 15 * 60, maxRequests: 5 }),
  signup,
);

export default router;
