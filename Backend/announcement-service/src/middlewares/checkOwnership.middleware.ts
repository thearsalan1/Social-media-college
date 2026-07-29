import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/pisma.js";

export const checkOwnership = (paramsName: string = "id") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await prisma.announcementComment.findUnique({
        where: { id: Array.isArray(req.params[paramsName]) ? req.params[paramsName][0] : req.params[paramsName] },
      });

      if (!comment) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      if (comment.userId !== req.user?.userId) {
        return res.status(403).json({ success: false, message: "Not your comment" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Ownership check failed" });
    }
  };
};