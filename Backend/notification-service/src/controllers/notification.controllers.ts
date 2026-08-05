import { Request, Response } from "express";
import { Notification } from "../models/notification.model.js";
import { logger } from "../config/logger.js";

// GET /notifications
export const getNotifications = async (req: Request, res: Response) => {
  const { userId } = req.user!;

  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ isRead: 1, createdAt: -1 })   
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipientId: userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total },
    });
  } catch (error) {
    logger.error("Get notifications failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /notifications/:id/read
export const markOneAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;

  try {
    const notification = await Notification.findOne({ _id: id, recipientId: userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    logger.error("Mark as read failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /notifications/read-all
export const markAllAsRead = async (req: Request, res: Response) => {
  const { userId } = req.user!;

  try {
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    logger.error("Mark all as read failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /notifications/unread-count
export const getUnreadCount = async (req: Request, res: Response) => {
  const { userId } = req.user!;

  try {
    const count = await Notification.countDocuments({ recipientId: userId, isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    logger.error("Get unread count failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /notifications/:id
export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.user!;

  try {
    const notification = await Notification.findOneAndDelete({ _id: id, recipientId: userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    logger.error("Delete notification failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};