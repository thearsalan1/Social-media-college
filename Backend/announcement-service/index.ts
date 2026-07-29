import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

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

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: "Announcement service running" });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Announcemente service is running at http://localhost:${PORT}`);
});
