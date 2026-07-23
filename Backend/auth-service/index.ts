import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { connection } from "./src/config/redis.js";
import { emailWorker } from "./src/worker/email.worker.js";
import cookieParser from "cookie-parser";
import rosterRoutes from "./src/routes/admin.route.js";
import authRoutes from "./src/routes/auth.routes.js";
import studentRoutes from "./src/routes/students.routes.js";
import helmet from "helmet";
import { scheduleCleanup } from "./src/queue/cleanup.queue.js";
import { cleanupWorker } from "./src/worker/cleanup.worker.js";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "auth-service is running " });
});

app.use("/auth", rosterRoutes);
app.use("/auth", authRoutes);
app.use("/auth", studentRoutes);

connection;
emailWorker;

scheduleCleanup();
cleanupWorker;

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:5001`);
});
