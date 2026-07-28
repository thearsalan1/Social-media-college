import { Request, Response } from "express";
import { getModelByTargetType } from "../middlewares/getModelByTargetType.js";
import { Like } from "../models/Likes.Model.js";
import { targetType as TargetTypeEnum } from "../types/types.js";

export const toggleLike = async (req: Request, res: Response) => {
  const { targetId, targetType } = req.body;
  const { userId } = req.user!;

  try {
    if (!targetId || !targetType) {
      return res.status(400).json({ success: false, message: "Data needed" });
    }

    if (!Object.values(TargetTypeEnum).includes(targetType)) {
      return res
        .status(400)
        .json({ success: false, message: "Target type invalid" });
    }

    const Model = getModelByTargetType(targetType as TargetTypeEnum);
    const post = await Model.findById(targetId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const existingLike = await Like.findOne({ userId, targetId, targetType });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      return res
        .status(200)
        .json({ success: true, liked: false, message: "Unliked successfully" });
    } else {
      await Like.create({ userId, targetId, targetType });
      return res
        .status(201)
        .json({ success: true, liked: true, message: "Liked successfully" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};
