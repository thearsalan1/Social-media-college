import { Redis } from "ioredis";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../config/logger.js";

export const subscribeToNotifications = (io: SocketIOServer) => {
  const subscriber = new Redis(process.env.REDIS_URL as string);

  subscriber.subscribe("user-notifications", (err) => {
    if (err) {
      logger.error("Failed to subscribe to user-notifications channel", {
        err,
      });
    } else {
      logger.info("Subscribed to user-notifications channel");
    }
  });

  subscriber.on("message", (channel, message) => {
    if (channel === "user-notifications") {
      try {
        const { recipientId, notification } = JSON.parse(message);
        io.to(`user:${recipientId}`).emit("new-notification", notification);
        logger.info("Real-time notification pushed", { recipientId });
      } catch (error) {
        logger.error("Failed to process notification message", { error });
      }
    }
  });
};
