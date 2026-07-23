import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  getUserById,
  searchStudent,
} from "../controllers/student.controller.js";

const router = Router();

router.get("/me", authMiddleware, getMyProfile);
router.patch("/me", authMiddleware, updateMyProfile);
router.get("/students/:id", authMiddleware, getUserById);
router.get("/students/search", authMiddleware, searchStudent);

export default router;
