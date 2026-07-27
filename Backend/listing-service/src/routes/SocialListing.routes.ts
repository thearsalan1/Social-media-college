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

const router = Router();

router.post(
  "/posts",
  authMiddleware,
  uploadImage.array("images", 5),
  sanitizeInput(["content"]),
  validate(createSocialPostSchema),
  createSocialPost,
);

router.get("/posts/my", authMiddleware, getMyPosts);
router.get("/posts/:postId", authMiddleware, getPostById);
router.get("/posts", authMiddleware, getAllPosts);

router.patch(
  "/posts/:postId",
  authMiddleware,
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