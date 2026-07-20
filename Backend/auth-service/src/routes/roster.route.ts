import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.middleware.js";
import { uploadCSV } from "../config/multer.js";
import { uploadRoaster } from "../controllers/roster.controller.js";

const router = Router();

router.post(
  "/admin/upload-roster",
  authMiddleware,
  requireRoles("ADMIN"),
  uploadCSV.single("file"),
  uploadRoaster,
);

export default router;
