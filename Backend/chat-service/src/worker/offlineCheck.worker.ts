import { Worker } from "bullmq";
import { connection as redis } from "../config/redis.js";
import { notificationQueue } from "../queue/notification.queue.js";
import { logger } from "../config/logger.js";

export const offlineCheckWorker = new Worker(
  "offline-message-check",
  async (job) => {
    const { recipientId, conversationId, senderName, preview } = job.data;

    const isOnline = await redis.exists(`online:${recipientId}`);
    if (isOnline) {
      logger.info("User came online, skipping offline notification", { recipientId });
      return;   
    }

    await notificationQueue.add("notification-event", {
      type: "NEW_MESSAGE",
      sourceService: "chat",
      recipientId,
      relatedId: conversationId,
      senderName,
      preview,
    });

    logger.info("Offline message notification queued", { recipientId, conversationId });
  },
  { connection: redis }
);