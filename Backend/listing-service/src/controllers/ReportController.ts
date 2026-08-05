import { Request, Response } from "express";
import { getModelByTargetType } from "../middlewares/getModelByTargetType.js";
import { targetType as TargetTypeEnum } from "../types/types.js";
import { emitNotifications } from "../utils/emitNotifications.js";
import { logger } from "../config/logger.js";

const REPORT_THRESHOLD = 5; // spec ke hisaab se — chhote user base ke liye adjusted

export const reportContent = async (req: Request, res: Response) => {
  const { targetType, targetId, reason } = req.body;
  const { userId } = req.user!;

  try {
    if (!targetType || !targetId) {
      return res.status(400).json({ success: false, message: "Data needed" });
    }

    if (!Object.values(TargetTypeEnum).includes(targetType)) {
      return res
        .status(400)
        .json({ success: false, message: "Target type invalid" });
    }

    const Model = getModelByTargetType(targetType as TargetTypeEnum);
    const target = await Model.findById(targetId);

    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Target not found" });
    }

    // Duplicate report check
    if (target.reportedBy.includes(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "You already reported this" });
    }

    target.reportedBy.push(userId);
    target.reportCount += 1;

    if (target.reportCount >= REPORT_THRESHOLD) {
      target.ishidden = true;
      target.hiddenAt = new Date();

      await emitNotifications({
        type: "CONTENT_AUTO_HIDDEN",
        recipientId: "ADMIN", 
        sourceService: "listing",
        relatedId: targetId,
        targetType,
        reportedBy: target.reportedBy,
        collegeName: req.user!.collegeName,
      });

      logger.info("Content auto-hidden due to reports", {
        targetType,
        targetId,
        reportCount: target.reportCount,
      });
    }

    await target.save();

    return res.status(200).json({ success: true, message: "Report submitted" });
  } catch (error) {
    logger.error("Report content failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin unban
export const unbanContent = async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;

  try {
    if (!Object.values(TargetTypeEnum).includes(targetType as TargetTypeEnum)) {
      return res
        .status(400)
        .json({ success: false, message: "Target type invalid" });
    }

    const Model = getModelByTargetType(targetType as TargetTypeEnum);
    const target = await Model.findByIdAndUpdate(
      targetId,
      { ishidden: false, reportCount: 0, reportedBy: [], hiddenAt: null },
      { new: true },
    );

    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Target not found" });
    }

    logger.info("Content unbanned by admin", { targetType, targetId });
    return res
      .status(200)
      .json({ success: true, message: "Content restored", data: target });
  } catch (error) {
    logger.error("Unban content failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
