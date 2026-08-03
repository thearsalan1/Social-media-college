import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connection } from "./src/config/redis.js";
import { connectDB } from "./src/db/db.js";
import { logger } from "./src/config/logger.js";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Notification service running" });
});

connectDB();
connection;

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  logger.info(`Notification service running at http://localhost:${PORT}`);
});