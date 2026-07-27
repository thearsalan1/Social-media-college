import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadMultipleImages,
} from "../utils/uploadToCloudinary.js";
import { MarketPlaceItem } from "../models/MarketPlace.model.js";
import { ItemCategory, itemStatus } from "../types/types.js";
import { logger } from "../config/logger.js";

export const createItem = async (req: Request, res: Response) => {
  const { title, description, price, itemCategory } = req.body;
  const { userId, collegeName, branch, name } = req.user!;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    if (!userId || !collegeName || !branch) {
      return res.status(400).json({
        success: false,
        message: "User needs to be authenticated first",
      });
    }

    if (!title || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "Post cannot be empty",
      });
    }

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Image needed",
      });
    }

    function isItemCategory(category: any): category is ItemCategory {
      return Object.values(ItemCategory).includes(category);
    }

    if (!isItemCategory(itemCategory)) {
      return res.status(400).json({
        success: false,
        message: "Valid Item category needed",
      });
    }

    const images = await uploadMultipleImages(files, "marketPlace-item");

    const newItem = await MarketPlaceItem.create({
      title,
      description,
      price,
      images,
      category: itemCategory,
      status: itemStatus.Available,
      userId,
      userName: name,
      collegeName,
      branch,
    });

    if (!newItem) {
      return res.status(400).json({
        success: false,
        message: "Failed to create new item",
      });
    }

    logger.info("New item created successfully");
    return res.status(200).json({
      success: true,
      message: "New item created successfully",
      data: newItem,
    });
  } catch (error) {
    logger.error("Error in creating new Item ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { title, description, price, category } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Item id required" });
    }

    const item = await MarketPlaceItem.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    function isItemCategory(cat: any): cat is ItemCategory {
      return Object.values(ItemCategory).includes(cat);
    }

    const updateData: Record<string, any> = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (category) {
      if (!isItemCategory(category)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid Item category needed" });
      }
      updateData.category = category;
    }

    if (files && files.length > 0) {
      const images = await uploadMultipleImages(files, "marketPlace-item");
      updateData.images = images;
    }

    const updatedItem = await MarketPlaceItem.findByIdAndUpdate(
      itemId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedItem) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to update item" });
    }

    logger.info("Item updated successfully");
    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    logger.error("Error in updating item ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  try {
    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Item id not found" });
    }
    const item = await MarketPlaceItem.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    if (item.images && item.images.length > 0) {
      for (const img of item.images) {
        await deleteFromCloudinary(img.publicId);
      }
    }
    const deleteItem = await MarketPlaceItem.findByIdAndDelete(itemId);
    if (!deleteItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    logger.info("Item deleted successfully ", deleteItem);
    res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getItemsDetail = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  try {
    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Item id required" });
    }
    const item = await MarketPlaceItem.findById(itemId).lean();
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    logger.info("Item found ", item);
    return res
      .status(200)
      .json({ success: true, message: "Item found successfully", data: item });
  } catch (error) {
    logger.error("Error in getting item's detail", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllItems = async (req: Request, res: Response) => {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    sortBy,
    branch,
    userId,
    page = 1,
    limit = 10,
  } = req.query as {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sortBy?: string;
    branch?: string;
    userId?: string;
    page?: string;
    limit?: string;
  };

  try {
    const query: Record<string, any> = {
      collegeName: req.user?.collegeName,
      ishidden: false,
      status: "AVAILABLE",
    };

    if (category) query.category = category;
    if (branch) query.branch = branch;
    if (userId) query.userId = userId;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === "oldest") sort = { createdAt: 1 };
    if (sortBy === "priceLowToHigh") sort = { price: 1 };
    if (sortBy === "priceHighToLow") sort = { price: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const items = await MarketPlaceItem.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalCount = await MarketPlaceItem.countDocuments(query);

    if (items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No items available",
        data: [],
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
        },
      });
    }

    logger.info(`Items found: ${items.length} for query`, query);
    return res.status(200).json({
      success: true,
      message: "Items available",
      data: items,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error("Error in getting items", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMyItems = async (req: Request, res: Response) => {
  const { userId } = req.user!;
  try {
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const items = await MarketPlaceItem.find({ userId }).lean();

    if (items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Items not posted yet",
        data: [],
      });
    }

    logger.info(`Items found for user ${userId}: ${items.length}`);
    return res.status(200).json({
      success: true,
      message: "Items found",
      data: items,
    });
  } catch (error) {
    logger.error("Error in finding items", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const toggleItemStatus = async (req: Request, res: Response) => {
  const { itemId } = req.params;

  try {
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item id required",
      });
    }

    const item = await MarketPlaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.status =
      item.status === itemStatus.Available
        ? itemStatus.Sold
        : itemStatus.Available;

    await item.save();

    logger.info(`Item ${itemId} status toggled to ${item.status}`);
    return res.status(200).json({
      success: true,
      message: `Item status updated to ${item.status}`,
      data: item,
    });
  } catch (error) {
    logger.error("Error in toggling item status", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
