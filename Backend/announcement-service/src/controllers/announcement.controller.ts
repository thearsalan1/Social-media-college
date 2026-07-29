import { notificationQueue } from "./../queue/notification.queue";
import { prisma } from "./../db/pisma";
import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadMultipleImages,
} from "../utils/uploadToCloudinary";
import { logger } from "../config/logger";

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
  let { id } = req.params;
  const { title, content, type, branch, expiresAt } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    id.toString();
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

      // Delete old attachments from Cloudinary
      for (const attachment of announcement.attachments) {
        await deleteFromCloudinary(attachment.publicId);
      }

      // Delete old attachments from DB
      await prisma.attachment.deleteMany({ where: { announcementId: id } });

      // Upload new ones
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
