import "dotenv/config";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { initialiseIo } from "./src/socket/socket.js";
import { connectDB } from "./src/db/db.js";
import messageRoutes from "./src/routes/message.routes.js";
import conversationRoutes from "./src/routes/conversation.routes.js";
import blockRoutes from "./src/routes/block.routes.js";

const app = express();
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.use("/chat", messageRoutes);
app.use("/chat", conversationRoutes);
app.use("/chat", blockRoutes);

app.get("/health", (req: Request, res: Response) => {
  return res
    .status(200)
    .json({ success: true, message: "chat-service running successfully" });
});
initialiseIo(io);
connectDB();

const PORT = process.env.PORT || 5004;
httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
