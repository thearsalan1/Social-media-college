import { Router } from "express";
import { authMiddleware, requireRoles } from "../middlewares/auth.middleware.js";   // ⚠️ note neeche
import { reportContent, unbanContent } from "../controllers/ReportController.js";

const router = Router();

router.post("/report", authMiddleware, reportContent);
router.patch("/admin/unban/:targetType/:targetId", authMiddleware, requireRoles("ADMIN"), unbanContent);

export default router;