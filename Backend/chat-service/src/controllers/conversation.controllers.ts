import { Request, Response } from "express";
import {
  getSortedParticipants,
  isBlockedEitherWay,
} from "../utils/chatHelpers.js";
import { Conversation } from "../models/Conversation.model.js";
import { originType, statusType } from "../types/types.js";
import { Message } from "../models/Message.model.js";
import { logger } from "../config/logger.js";

export const startDM = async (req: Request, res: Response) => {
  const { targetUserId, message } = req.body;
  const { userId, collegeName } = req.user!;
  try {
    if (!targetUserId || !message) {
      return res
        .status(400)
        .json({ success: false, message: "targetUserId and message required" });
    }
    if (targetUserId === userId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot message yourself" });
    }
    if (await isBlockedEitherWay(userId, targetUserId)) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot start conversation" });
    }
    const participants = getSortedParticipants(userId, targetUserId);
    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        status: statusType.Pending,
        requestedBy: userId,
        originType: originType.Dm,
        collegeName,
      });
    } else if (
      conversation.status === "PENDING" &&
      conversation.requestedBy !== userId
    ) {
      conversation.status = statusType.Active;
      await conversation.save();
    } else if (
      conversation.status === "PENDING" &&
      conversation.requestedBy === userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Request already sent, waiting for reply",
      });
    }
    const newMessage = await Message.create({
      conversationId: conversation._id.toString(),
      senderId: userId,
      content: message,
    });
    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();
    await conversation.save();
    logger.info("DM conversation started/messaged", {
      conversationId: conversation._id,
      userId,
    });
    return res
      .status(201)
      .json({ success: true, conversation, message: newMessage });
  } catch (error) {
    logger.error("Start DM failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const startMarketPlaceChat = async (req: Request, res: Response) => {
  const { sellerId, itemId, message } = req.body;
  const { userId, collegeName } = req.user!;
  try {
    if (!sellerId || !itemId || !message) {
      return res.status(400).json({
        success: false,
        message: "sellerId, itemId and message required",
      });
    }
    if (sellerId === userId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot message yourself" });
    }
    if (await isBlockedEitherWay(userId, sellerId)) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot start conversation" });
    }
    const participants = getSortedParticipants(userId, sellerId);
    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        originType: originType.MarketPlace,
        status: statusType.Active,
        lastItemId: itemId,
        collegeName,
      });
    } else {
      conversation.status = statusType.Active;
      conversation.lastItemId = itemId;
      await conversation.save();
    }
    if (!conversation) {
      return res
        .status(500)
        .json({ success: false, message: "Conversation creation failed" });
    }
    const newMessage = await Message.create({
      conversationId: conversation._id.toString(),
      senderId: userId,
      content: message,
    });
    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    logger.info("Marketplace conversation started/messaged", {
      conversationId: conversation._id,
      userId,
      itemId,
    });
    return res
      .status(201)
      .json({ success: true, conversation, message: newMessage });
  } catch (error) {
    logger.error("Start marketplace chat failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  const { userId } = req.user!;
  try {
    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
    }).sort({ lastMessageAt: -1 });
    return res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    logger.error("Get conversations failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRequests = async (req: Request, res: Response) => {
  const { userId } = req.user!;
  try {
    const requests = await Conversation.find({
      participants: userId,
      status: statusType.Pending,
      requestedBy: { $ne: userId },
    }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    logger.error("Get requests failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getConversationId = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Conversation id needed" });
    }
    const converstion = await Conversation.findOne({
      _id: id,
      participants: userId,
    });
    if (!converstion) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Conversation found",
      data: converstion,
    });
  } catch (error) {
    logger.error("Get conversation by id failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const acceptRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;
  try {
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    if (conversation.requestedBy === userId) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot accept your own request" });
    }

    conversation.status = statusType.Active;
    await conversation.save();

    return res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    logger.error("Accept request failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const archiveConversation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, participants: userId },
      { $addToSet: { archivedBy: userId } }, // duplicate add nahi hone deta
      { new: true },
    );

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    return res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    logger.error("Archive failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const unarchiveConversation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, participants: userId },
      { $pull: { archivedBy: userId } },
      { new: true },
    );

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    return res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    logger.error("Unarchive failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
