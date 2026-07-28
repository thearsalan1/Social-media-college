import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkOwnership } from "../middlewares/checkOwnership.middleware.js";
import { sanitizeInput } from "../middlewares/sanatizeInput.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadImage } from "../config/multer.js";
import { createSocialPostSchema } from "../validator/listing.validator.js";
import { SocialPost } from "../models/SocialPost.model.js";
import {
  createSocialPost,
  getAllPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/SocialListingController.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post(
  "/posts",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 15,
    prefix: "create-post",
  }),
  uploadImage.array("images", 5),
  sanitizeInput(["content"]),
  validate(createSocialPostSchema),
  createSocialPost,
);

router.get(
  "/posts/my",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 200,
    prefix: "browse",
  }),
  getMyPosts,
);
router.get(
  "/posts/:postId",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 200,
    prefix: "browse",
  }),
  getPostById,
);
router.get(
  "/posts",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 200,
    prefix: "browse",
  }),
  getAllPosts,
);

router.patch(
  "/posts/:postId",
  authMiddleware,
  createRateLimiter({
    windowInSeconds: 3600,
    maxRequests: 20,
    prefix: "edit-post",
  }),
  checkOwnership(SocialPost, "postId"),
  uploadImage.array("images", 5),
  sanitizeInput(["content"]),
  updatePost,
);

router.delete(
  "/posts/:postId",
  authMiddleware,
  checkOwnership(SocialPost, "postId"),
  deletePost,
);

export default router;
