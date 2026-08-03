import { Request, Response } from "express";
import { canSendMessage } from "../utils/messageValidation.js";
import { statusType } from "../types/types.js";
import { Message } from "../models/Message.model.js";
import { logger } from "../config/logger.js";
import { Conversation } from "../models/Conversation.model.js";

import { uploadSingleImage } from "../utils/uploadToCloudinary.js";

export const sendMessage = async (req: Request, res: Response) => {
  const { conversationId, content } = req.body;
  const { userId } = req.user!;
  const file = req.file as Express.Multer.File | undefined;   // .single() se ek hi file

  try {
    if (!conversationId || (!content && !file)) {
      return res.status(400).json({ success: false, message: "conversationId and content/image required" });
    }

    const check = await canSendMessage(conversationId, userId);
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.reason });
    }

    if (check.becomesActive) {
      check.conversation!.status = statusType.Active;
    }

    let imageUrl: string | undefined;
    if (file) {
      const uploaded = await uploadSingleImage(file.buffer);
      imageUrl = uploaded.url;
    }

    const message = await Message.create({ conversationId, senderId: userId, content, imageUrl });

    check.conversation!.lastMessage = content || "[Image]";
    check.conversation!.lastMessageAt = new Date();
    await check.conversation!.save();

    return res.status(201).json({ success: true, message });
  } catch (error) {
    logger.error("Send message failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { userId } = req.user!;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(50, parseInt(req.query.limit as string) || 30);
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Message.countDocuments({ conversationId });
    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    logger.error("Get messages failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { userId } = req.user!;

  try {
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, isRead: false },
      { isRead: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    logger.error("Mark as read failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const editMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const { userId } = req.user!;

  try {
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Content required" });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not your message" });
    }

    if (message.imageUrl && !message.content) {
      return res
        .status(400)
        .json({ success: false, message: "Image messages cannot be edited" });
    }

    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt!.getTime() > fifteenMinutes) {
      return res
        .status(403)
        .json({ success: false, message: "Edit window expired" });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return res.status(200).json({ success: true, message });
  } catch (error) {
    logger.error("Edit message failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;

  try {
    const message = await Message.findById(id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not your message" });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = undefined;
    message.imageUrl = null;
    await message.save();

    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    logger.error("Delete message failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
