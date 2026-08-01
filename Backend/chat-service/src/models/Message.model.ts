import mongoose from "mongoose";
import { messageInterface } from "../types/types.js";

const messageSchema = new mongoose.Schema<messageInterface>(
  {
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, maxlength: 1000 },
    imageUrl: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdAt:{type:Date,default:null}
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
