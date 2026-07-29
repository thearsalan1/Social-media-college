import { Router } from "express";
import {
  authMiddleware,
  requireRoles,
} from "../middlewares/auth.middleware.js";
import {
  reportContent,
  unbanContent,
} from "../controllers/ReportController.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post(
  "/report",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 10,
    prefix: "report",
  }),
  reportContent,
);

router.patch(
  "/admin/unban/:targetType/:targetId",
  authMiddleware,
  requireRoles("ADMIN"),
  unbanContent,
);

export default router;
