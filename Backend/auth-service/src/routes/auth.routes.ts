import { Router } from "express";
import {
  forgetPassword,
  login,
  logOut,
  refreshAccessToken,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { otpSchema, signupSchema } from "../validator/auth.validator.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/sign-up",
  createRateLimiter({ windowInSeconds: 15 * 60, maxRequests: 3 }),
  validate(signupSchema),
  signup,
);
router.post(
  "/verify",
  createRateLimiter({ windowInSeconds: 10 * 60, maxRequests: 5 }),
  validate(otpSchema),
  verifyOtp,
);
router.post(
  "/login",
  createRateLimiter({ windowInSeconds: 15 * 60, maxRequests: 5 }),
  login,
);
router.post(
  "/refresh-token",
  createRateLimiter({ windowInSeconds: 60 * 60, maxRequests: 10 }),
  refreshAccessToken,
);
router.post(
  "/forgot-password",
  createRateLimiter({ windowInSeconds: 60 * 60, maxRequests: 3 }),
  forgetPassword,
);
router.post(
  "/reset-password",
  createRateLimiter({ windowInSeconds: 60 * 60, maxRequests: 3 }),
  resetPassword,
);
router.get(
  "/logout",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 60 * 60, maxRequests: 3 }),
  logOut,
);
router.get(
  "/resend-otp",
  createRateLimiter({ windowInSeconds: 60 * 60, maxRequests: 3 }),
  resendOtp,
);

export default router;
