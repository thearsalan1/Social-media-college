import mongoose from "mongoose";
import { logger } from "../config/logger";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection failed", { error });
    process.exit(1);
  }
}