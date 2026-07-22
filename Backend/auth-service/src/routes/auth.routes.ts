import { Router } from "express";
import { signup, verifyOtp } from "../controllers/auth.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { otpSchema, signupSchema } from "../validator/auth.validator.js";

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

export default router;
