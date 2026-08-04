import mongoose from "mongoose";
import { NotificationInterface } from "../types/types";

const notificationSchema = new mongoose.Schema<NotificationInterface>(
  {
    recipientId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    sourceService: { type: String },
    relatedId: { type: String },
    isRead: { type: Boolean, default: false },
    emailStatus: {
      type: String,
      enum: ["NOT_APPLICABLE", "SENT", "FAILED"],
      default: "NOT_APPLICABLE",
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

export const Notification = mongoose.model("Notification", notificationSchema);
