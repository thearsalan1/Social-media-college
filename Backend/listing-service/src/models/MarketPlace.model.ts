import mongoose from "mongoose";
import {
  MarketPlaceInterface,
  ItemCategory,
  itemStatus,
} from "../types/types.js";

const marketPlaceSchema = new mongoose.Schema<MarketPlaceInterface>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 50,
      maxlength: 300,
    },
    price: { type: Number, required: true, min: 10, max: 10000 },
    category: {
      type: String,
      required: true,
      enum: Object.values(ItemCategory),
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: Object.values(itemStatus),
      default: itemStatus.Available,
    },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    collegeName: { type: String, required: true },
    branch: { type: String, required: true },
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: String }],
    ishidden: { type: Boolean, default: false },
    hiddenAt: { type: Date, default: null },
  },
  { timestamps: true },
);

marketPlaceSchema.index({ collegeName: 1 });

export const MarketPlaceItem = mongoose.model<MarketPlaceInterface>(
  "MarketPlaceItem",
  marketPlaceSchema,
);
