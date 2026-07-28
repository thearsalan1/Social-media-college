import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../config/multer.js";
import { sanitizeInput } from "../middlewares/sanatizeInput.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createMarketplaceSchema } from "../validator/listing.validator.js";
import {
  createItem,
  deleteItem,
  getAllItems,
  getItemsDetail,
  getMyItems,
  toggleItemStatus,
  updateItem,
} from "../controllers/MarketPlaceController.js";
import { scopeToMiddleware } from "../middlewares/scopeToCollege.middleware.js";
import { MarketPlaceItem } from "../models/MarketPlace.model.js";
import { checkOwnership } from "../middlewares/checkOwnership.middleware.js";

const router = Router();

router.post(
  "/marketplace",
  authMiddleware,
  uploadImage.array("images", 5),
  sanitizeInput(["title", "description"]),
  validate(createMarketplaceSchema),
  createItem,
);

router.get("/marketplace/my", authMiddleware, getMyItems);
router.get("/marketplace/:item", authMiddleware, getItemsDetail);
router.get("/marketplace", authMiddleware, scopeToMiddleware, getAllItems);

router.patch(
  "/marketplace/:itemId",
  authMiddleware,
  checkOwnership(MarketPlaceItem, "itemId"),
  uploadImage.array("images", 5),
  sanitizeInput(["title", "description"]),
  updateItem,
);

router.delete(
  "/marketplace/:itemId",
  authMiddleware,
  checkOwnership(MarketPlaceItem, "itemId"),
  deleteItem,
);

router.patch(
  "/marketplace/:itemId/status",
  authMiddleware,
  checkOwnership(MarketPlaceItem, "itemId"),
  toggleItemStatus,
);

export default router;
