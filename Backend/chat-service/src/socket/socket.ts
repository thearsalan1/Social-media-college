import { Socket, Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth.js";
import { logger } from "../config/logger.js";
import { connection as redis } from "../config/redis.js";

export const initialiseIo = (io: SocketIOServer) => {
  io.use(socketAuthMiddleware);
  io.on("connect", () => {
    logger.info(`User connected`);
  });
  io.on("connection", async (socket: Socket) => {
    const userId = socket.user!.userId;
    logger.info(`Socket connected: ${socket.id}`, { userId });

    socket.join(`user:${userId}`);

    await redis.set(`online:${userId}`, "true", "EX", 60);

    socket.on("disconnect", async () => {
      await redis.del(`online:${userId}`);
      logger.info(`Socket disconnected: ${socket.id}`, { userId });
    });
  });
};
