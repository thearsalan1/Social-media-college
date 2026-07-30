import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connection } from "./src/config/redis.js";
import { logger } from "./src/config/logger.js";
import announcemetRoutes from "./src/routes/announcement.routes.js";
import commentsRoutes from "./src/routes/comments.routes.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/announcement", announcemetRoutes);
app.use("/announcement", commentsRoutes);

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: "Announcement service running" });
});

connection;

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  logger.info(`Announcement service is running at http://localhost:${PORT}`);
});
