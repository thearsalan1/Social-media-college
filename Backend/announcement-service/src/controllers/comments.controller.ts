import { Request, Response } from "express";
import { normalizeParam } from "../utils/normalizeParams.js";
import { prisma } from "../db/pisma.js";
import { logger } from "../config/logger.js";

export const createComment = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  const { content } = req.body;
  const { userId, name } = req.user!;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Announcement id needed" });
  }
  if (!content) {
    return res.status(400).json({ success: false, message: "Content needed" });
  }
  if (!userId || !name) {
    res
      .status(400)
      .json({ success: false, message: "User need to authenticate first" });
  }
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      return res
        .status(400)
        .json({ success: false, message: "Announcement not found" });
    }
    const comment = await prisma.announcementComment.create({
      data: {
        content,
        userId,
        userName: name,
        announcementId: id,
      },
    });
    logger.info(`Comment created by user ${comment.content}`);
    res
      .status(201)
      .json({ success: true, message: "Comment created successfully" });
  } catch (error) {
    logger.error(`Error in comment creation ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllCommentsOnAnnouncement = async (
  req: Request,
  res: Response,
) => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Announcement id needed" });
  }
  try {
    const announcement = await prisma.announcement.findFirst({
      where: { id },
    });
    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }
    const comments = await prisma.announcementComment.findMany({
      where: {
        announcementId: id,
      },
    });
    if (!comments) {
      return res
        .status(400)
        .json({ success: false, message: "Comments not found" });
    }
    if (comments.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No comments available" });
    }
    logger.info(`comments found for the announcement are : ${comments.length}`);
    res
      .status(200)
      .json({ success: false, message: "Comment found", data: comments });
  } catch (error) {
    logger.error(`Error in comment fetching ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Comment id needed" });
  }
  try {
    const comment = await prisma.announcementComment.delete({
      where: { id },
    });
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "Comment not found" });
    }
    logger.info(`Comment deleted successfully `);
    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    logger.error(`Error in comment deletion ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
