import { Router } from "express";
import { verifyInternalSecret } from "../middleware/verifyInternalSecret.middleware.js";
import { getStudentsForNotification } from "../controllers/interna.controller.js";

const router = Router();

router.post(
  "/internal/students",
  verifyInternalSecret,
  getStudentsForNotification,
);

export default router;
