import { notificationQueue } from "./../queue/notification.queue";
import { prisma } from "./../db/pisma";
import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadMultipleImages,
} from "../utils/uploadToCloudinary";
import { logger } from "../config/logger";
import { normalizeParam } from "../utils/normalizeParams";

export const createAnnouncement = async (req: Request, res: Response) => {
  const { title, content, type, branch, expiresAt } = req.body;
  const { userId, name, collegeName } = req.user!;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    if (!title || !content || !type) {
      return res.status(400).json({ success: false, message: "Data needed" });
    }

    let uploadedFiles: { url: string; publicId: string }[] = [];
    if (files && files.length > 0) {
      if (files.length > 3) {
        return res
          .status(400)
          .json({ success: false, message: "Maximum 3 attachments allowed" });
      }
      uploadedFiles = await uploadMultipleImages(files, "announcements");
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        postedBy: userId,
        postedByName: name,
        collegeName,
        branch: branch || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachments: {
          create: uploadedFiles.map((f) => ({
            url: f.url,
            publicId: f.publicId,
          })),
        },
      },
      include: { attachments: true },
    });

    await notificationQueue.add("notification-events", {
      type: "NEW_ANNOUNCEMENT",
      sourceService: "announcement",
      relatedId: announcement.id,
      collegeName,
      branch: branch || null,
      title: announcement.title,
    });

    logger.info("Announcement created", {
      announcementId: announcement.id,
      postedBy: userId,
    });
    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    logger.error("Create announcement failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  const { title, content, type, branch, expiresAt } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    let uploadedFiles: { url: string; publicId: string }[] = [];
    if (files && files.length > 0) {
      if (files.length > 3) {
        return res
          .status(400)
          .json({ success: false, message: "Maximum 3 attachments allowed" });
      }

      for (const attachment of announcement.attachments) {
        await deleteFromCloudinary(attachment.publicId);
      }

      await prisma.attachment.deleteMany({ where: { announcementId: id } });

      uploadedFiles = await uploadMultipleImages(files, "announcements");
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title ?? announcement.title,
        content: content ?? announcement.content,
        type: type ?? announcement.type,
        branch: branch ?? announcement.branch,
        expiresAt: expiresAt ? new Date(expiresAt) : announcement.expiresAt,
        attachments: uploadedFiles.length
          ? {
              create: uploadedFiles.map((f) => ({
                url: f.url,
                publicId: f.publicId,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    logger.info("Announcement updated", { announcementId: id });
    return res.status(200).json({ success: true, announcement: updated });
  } catch (error) {
    logger.error("Update announcement failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Announcement id needed" });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    for (const attachment of announcement.attachments) {
      await deleteFromCloudinary(attachment.publicId);
    }

    await prisma.attachment.deleteMany({ where: { announcementId: id } });
    await prisma.announcement.delete({ where: { id } });

    logger.info("Announcement deleted", { announcementId: id });
    return res
      .status(200)
      .json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    logger.error("Delete announcement failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const togglePinned = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);

  if (!id) {
    return res.status(400).json({ success: false, message: "Id needed" });
  }

  try {
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        isPinned: {
          set: undefined,
        },
      },
      select: { isPinned: true },
    });

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        isPinned: !announcement.isPinned,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Announcement ${updated.isPinned ? "pinned" : "unpinned"} successfully`,
    });
  } catch (error) {
    logger.error(`Error in pinning the announcement`, { error });
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany();
    if (!announcements) {
      return res
        .status(400)
        .json({ success: false, message: "Announcements not found" });
    }
    if (announcements.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "Announcements not available" });
    }
    logger.info(`Annoucements found are ${announcements.length}`);
    res.status(200).json({
      success: false,
      message: "Announcements found",
      data: announcements,
    });
  } catch (error) {
    logger.error(`Error in finding announcements ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
