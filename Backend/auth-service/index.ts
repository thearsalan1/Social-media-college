import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import { connection } from "./src/config/redis.js";
import { emailWorker } from "./src/worker/email.worker.js";
import cookieParser from "cookie-parser";
import rosterRoutes from "./src/routes/admin.route.js";
import authRoutes from "./src/routes/auth.routes.js";
import studentRoutes from "./src/routes/students.routes.js";

const app = express();
app.use(cors());
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
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:5001`);
});
