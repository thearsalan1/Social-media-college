import {
  createComment,
  deleteComment,
  getAllComments,
} from "./../controllers/CommentsController.js";
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { sanitizeInput } from "../middlewares/sanatizeInput.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createCommentSchema } from "../validator/listing.validator.js";
import { checkOwnership } from "../middlewares/checkOwnership.middleware.js";
import { Comments } from "../models/Comments.Model.js";

const router = Router();

router.post(
  "/comment",
  authMiddleware,
  sanitizeInput(["content"]),
  validate(createCommentSchema),
  createComment,
);

router.get("/comments/:targetType/:targetId", authMiddleware, getAllComments);

router.delete(
  "/comment/:id",
  authMiddleware,
  checkOwnership(Comments, "id"),
  deleteComment,
);

export default router;
