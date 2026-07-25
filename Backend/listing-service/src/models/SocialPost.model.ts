import mongoose from "mongoose";
import { socialPostInterface } from "../types/types.js";

const socialPostSchema = new mongoose.Schema<socialPostInterface>(
  {
    content: {
      type: String,
      required: true,
      maxLength: [500, "Content must be under 500 characters"],
      minLength: [5, "Content must be above 5 characters"],
      trim: true,
    },
    image: [
      {
        type: String,
        required: true,
      },
    ],
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    collegeName: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    reportCount: {
      type: Number,
      required: true,
      default: 0,
    },
    reportedBy: [{
      type: String,
    }],
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

socialPostSchema.index({ collegeName: 1 });

export const SocialPost = mongoose.model<socialPostInterface>(
  "SocialPost",
  socialPostSchema,
);
