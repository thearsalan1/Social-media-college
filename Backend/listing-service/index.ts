import helmet from "helmet";
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { connection } from "./src/config/redis.js";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: "listing-service is running " });
});

connection;

const PORT = process.env.PORT || "5002";
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:5002`);
});
