import mongoose from "mongoose";
import { BlockInterface } from "../types/types.js";

const blockSchema = new mongoose.Schema<BlockInterface>(
  {
    blockedBy: { type: String, required: true },
    blockedUser: { type: String, required: true },
  },
  { timestamps: true }
);

blockSchema.index({ blockedBy: 1, blockedUser: 1 }, { unique: true });

export const Block = mongoose.model("Block", blockSchema);