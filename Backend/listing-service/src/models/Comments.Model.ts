import mongoose from "mongoose";
import { CommentInterface, targetType } from "./../types/types.js";

const CommentSchema = new mongoose.Schema<CommentInterface>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 300,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: Object.values(targetType),
      default: targetType.post,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    reportCount: {
      type: Number,
      required: true,
      default: 0,
    },
    reportedBy: [
      {
        type: String,
      },
    ],
    ishidden: {
      type: Boolean,
      required: true,
      default: false,
    },
    hiddenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

CommentSchema.index({ targetId: 1, targetType: 1 });

export const Comments = mongoose.model<CommentInterface>(
  "Comments",
  CommentSchema,
);
