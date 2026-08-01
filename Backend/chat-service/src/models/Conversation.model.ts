import mongoose from "mongoose";
import {
  converstionInterface,
  originType,
  statusType,
} from "../types/types.js";

const conversationSchema = new mongoose.Schema<converstionInterface>(
  {
    participants: [{ type: String, required: true }],
    status: {
      type: String,
      enum: Object.values(statusType),
      default: statusType.Pending,
    },
    requestedBy: { type: String },
    originType: {
      type: String,
      enum: Object.values(originType),
      default: originType.Dm,
    },
    lastItemId: { type: String },
    collegeName: { type: String, required: true },
    archivedBy: [{ type: String }],
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ collegeName: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
