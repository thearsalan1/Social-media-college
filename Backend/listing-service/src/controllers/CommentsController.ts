import { Request, Response } from "express";
import { getModelByTargetType } from "../middlewares/getModelByTargetType.js";
import { Comments } from "../models/Comments.Model.js";
import { emitNotifications } from "../utils/emitNotifications.js";
import { targetType as TargetTypeEnum } from "../types/types.js";
import { logger } from "../config/logger.js";

const normalizeParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (!param) return undefined;
  return Array.isArray(param) ? param[0] : param;
};

// ✅ Create Comment
export const createComment = async (req: Request, res: Response) => {
  const { content, targetType } = req.body;
  let targetId = normalizeParam(req.params.targetId);
  const { userId, name } = req.user!;

  try {
    if (!content || !targetType) {
      return res.status(400).json({ success: false, message: "Data needed" });
    }
    if (!Object.values(TargetTypeEnum).includes(targetType)) {
      return res
        .status(400)
        .json({ success: false, message: "Target type invalid" });
    }
    if (!targetId) {
      return res
        .status(400)
        .json({ success: false, message: "Target id needed" });
    }

    const Model = getModelByTargetType(targetType as TargetTypeEnum);
    const post = await Model.findById(targetId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const comment = await Comments.create({
      content,
      userId,
      userName: name,
      targetType,
      targetId,
    });

    if (post.userId !== userId) {
      await emitNotifications({
        type: "NEW_COMMENT",
        recipientId: post.userId,
        sourceService: "listing",
        relatedId: targetId,
        targetType,
        commenterName: name,
      });
    }

    return res.status(201).json({ success: true, comment });
  } catch (error) {
    logger.error("Create comment failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get All Comments
export const getAllComments = async (req: Request, res: Response) => {
  let targetId = normalizeParam(req.params.targetId);
  let targetType = normalizeParam(req.params.targetType);

  try {
    if (!targetId || !targetType) {
      return res
        .status(400)
        .json({ success: false, message: "Id or type not found" });
    }
    if (!Object.values(TargetTypeEnum).includes(targetType as any)) {
      return res
        .status(400)
        .json({ success: false, message: "Target type invalid" });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 15);
    const skip = (page - 1) * limit;

    const Model = getModelByTargetType(targetType as TargetTypeEnum);
    const post = await Model.findById(targetId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Target not found" });
    }

    const comments = await Comments.find({
      targetId,
      targetType: targetType as TargetTypeEnum,
      ishidden: false,
    })
      .select("content userName targetType userId createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Comments.countDocuments({
      targetId,
      targetType: targetType as TargetTypeEnum,
      ishidden: false,
    });

    return res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch comments", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete Comment
export const deleteComment = async (req: Request, res: Response) => {
  const commentId = normalizeParam(req.params.id);

  try {
    if (!commentId) {
      return res
        .status(400)
        .json({ success: false, message: "Comment id not found" });
    }

    const comment = await Comments.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    await Comments.deleteOne({ _id: commentId });
    logger.info(`Comment deleted successfully: ${comment.content}`);

    return res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete comment", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
