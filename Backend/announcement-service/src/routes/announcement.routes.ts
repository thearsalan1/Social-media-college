import { Router } from "express";
import { authMiddleware, requireRoles } from "../middlewares/auth-middleware.js";
import { sanitizeInput } from "../middlewares/sanatizeInput.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { uploadImage } from "../config/multer.js";
import { createAnnouncementSchema } from "../validator/announcement.validator.js";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinned,
  getAllAnnouncements,
  getAnnouncementWithId,
} from "../controllers/announcement.controller.js";

const router = Router();

// Create — ADMIN only
router.post(
  "/announcements",
  authMiddleware,
  requireRoles("ADMIN"),
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 10, prefix: "create-announcement" }),
  uploadImage.array("attachments", 3),
  sanitizeInput(["title", "content"]),
  validate(createAnnouncementSchema),
  createAnnouncement
);

// Edit — any ADMIN (collaborative model, no ownership check — spec decision)
router.patch(
  "/announcements/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 15, prefix: "edit-announcement" }),
  uploadImage.array("attachments", 3),
  sanitizeInput(["title", "content"]),
  updateAnnouncement
);

// Delete — any ADMIN
router.delete(
  "/announcements/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 10, prefix: "delete-announcement" }),
  deleteAnnouncement
);

// Pin toggle — any ADMIN
router.patch(
  "/announcements/:id/pin",
  authMiddleware,
  requireRoles("ADMIN"),
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 5, prefix: "pin-announcement" }),
  togglePinned
);

// Reads — any verified user (student or admin)
router.get(
  "/announcements/:id",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 200, prefix: "browse" }),
  getAnnouncementWithId
);

router.get(
  "/announcements",
  authMiddleware,
  createRateLimiter({ windowInSeconds: 3600, maxRequests: 200, prefix: "browse" }),
  getAllAnnouncements
);

export default router;