import { notificationQueue } from "./../queue/notification.queue.js";
import { prisma } from "./../db/pisma.js";
import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadMultipleImages,
} from "../utils/uploadToCloudinary.js";
import { logger } from "../config/logger.js";
import { normalizeParam } from "../utils/normalizeParams.js";

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
  if (!id)
    return res.status(400).json({ success: false, message: "Id needed" });

  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: { isPinned: true },
    });

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { isPinned: !announcement.isPinned },
    });

    return res.status(200).json({
      success: true,
      message: `Announcement ${updated.isPinned ? "pinned" : "unpinned"} successfully`,
    });
  } catch (error) {
    logger.error("Error pinning announcement", { error });
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const { type, branch, page = 1, limit = 10 } = req.query;
    const { collegeName } = req.user!;

    const filters: any = {
      collegeName,
      type: type || undefined,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    if (branch) filters.branch = branch;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: filters,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { attachments: true },
      }),
      prisma.announcement.count({ where: filters }),
    ]);

    return res.status(200).json({
      success: true,
      data: announcements,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
      },
    });
  } catch (error) {
    logger.error("Error fetching announcements", { error });
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAnnouncementWithId = async (req: Request, res: Response) => {
  const id = normalizeParam(req.params.id);
  const { collegeName } = req.user!;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Announcement Id needed" });
    }
    const announcement = await prisma.announcement.findUnique({
      where: { id, collegeName },
    });
    if (!announcement) {
      return res
        .status(400)
        .json({ success: false, message: "Announcement not found" });
    }
    logger.info(`Announcement found ${announcement}`);
    return res.status(200).json({
      success: true,
      message: "Announcement found",
      data: announcement,
    });
  } catch (error) {
    logger.error(`Error in finding announcement ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
