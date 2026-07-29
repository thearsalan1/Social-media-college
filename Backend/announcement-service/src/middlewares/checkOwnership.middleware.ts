import { Request, Response, NextFunction } from "express";
import { Model } from "mongoose";

export const checkOwnership = (
  Model: Model<any>,
  paramsName: string = "id",
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await Model.findById(req.params[paramsName]);
      if (!item) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      if (item.userId !== req.user?.userId) {
        return res
          .status(403)
          .json({ success: false, message: "Not your item" });
      }
      next();
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Ownership check failed" });
    }
  };
};
