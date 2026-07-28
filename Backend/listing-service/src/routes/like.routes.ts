import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { toggleLike } from "../controllers/LikeController.js";

const router = Router();

router.post("/like", authMiddleware, toggleLike);

export default router;
