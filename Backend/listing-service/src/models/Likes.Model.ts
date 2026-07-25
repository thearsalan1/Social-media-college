import { LikeInterface, targetType } from "./../types/types.js";
import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema<LikeInterface>(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: Object.values(targetType),
      default: targetType.post,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

LikeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Like = mongoose.model<LikeInterface>("Like", LikeSchema);
