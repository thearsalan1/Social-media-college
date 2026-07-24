import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.middleware.js";
import { uploadCSV } from "../config/multer.js";
import {
  filterBranch,
  uploadRoaster,
} from "../controllers/admin.controller.js";

const router = Router();

router.post(
  "/admin/upload-roster",
  // authMiddleware,
  // requireRoles("ADMIN"),
  uploadCSV.single("file"),
  uploadRoaster,
);

router.post(
  "/admin/branches",
  authMiddleware,
  requireRoles("ADMIN"),
  filterBranch,
);

export default router;
