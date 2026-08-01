import { Request, Response } from "express";
import { Block } from "../models/Blocked.model.js";
import { logger } from "../config/logger.js";

export const blockUser = async (req: Request, res: Response) => {
  const { blockedUserId } = req.body;
  const { userId } = req.user!;

  try {
    if (!blockedUserId) {
      return res.status(400).json({ success: false, message: "blockedUserId required" });
    }

    if (blockedUserId === userId) {
      return res.status(400).json({ success: false, message: "Cannot block yourself" });
    }

    const existing = await Block.findOne({ blockedBy: userId, blockedUser: blockedUserId });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already blocked" });
    }

    const block = await Block.create({ blockedBy: userId, blockedUser: blockedUserId });

    logger.info("User blocked", { userId, blockedUserId });
    return res.status(201).json({ success: true, block });
  } catch (error) {
    logger.error("Block user failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  const { userId: targetUserId } = req.params;
  const { userId } = req.user!;

  try {
    const result = await Block.findOneAndDelete({ blockedBy: userId, blockedUser: targetUserId });

    if (!result) {
      return res.status(404).json({ success: false, message: "Block record not found" });
    }

    logger.info("User unblocked", { userId, targetUserId });
    return res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error) {
    logger.error("Unblock user failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBlockedUsers = async (req: Request, res: Response) => {
  const { userId } = req.user!;

  try {
    const blocks = await Block.find({ blockedBy: userId });
    return res.status(200).json({ success: true, data: blocks });
  } catch (error) {
    logger.error("Get blocked users failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};