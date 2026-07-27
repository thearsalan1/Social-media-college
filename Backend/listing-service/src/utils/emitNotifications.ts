import { logger } from "../config/logger.js";
import { notificationQueue } from "../queue/notification.queue.js";

interface notificationPayLoad {
  type: string;
  recipientId: string;
  sourceService: "listing";
  relatedId: string;
  [key: string]: any;
}

export const emitNotifications = async (payload: notificationPayLoad) => {
  try {
    await notificationQueue.add("notification-event", payload);
    logger.info("Notification event emitted", {
      type: payload.type,
      recipientId: payload.recipientId,
    });
  } catch (error) {
    logger.error("Failed to emit notification event", { error, payload });
  }
};
