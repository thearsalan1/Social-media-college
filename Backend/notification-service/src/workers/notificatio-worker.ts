import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import { Notification } from "../models/notification.model.js";
import { generateTitle, generateMessage } from "../utils/notification-text.js";
import { publishRealtimeNotification } from "../utils/publishRealTime.js";
import { sendEmail } from "../utils/sendEmail.js";
import { logger } from "../config/logger.js";

const EMAIL_REQUIRED_TYPES = ["NEW_ANNOUNCEMENT", "CONTENT_AUTO_HIDDEN"];

export const notificationWorker = new Worker(
  "notification-events",
  async (job) => {
    const { type, recipientId, sourceService, relatedId, ...data } = job.data;

    if (!recipientId || recipientId === "ADMIN") {
      logger.info("Admin-targeted notification, deferred to bulk-resolve logic", { type });
      return;
    }

    const notification = await Notification.create({
      recipientId,
      type,
      title: generateTitle(type, data),
      message: generateMessage(type, data),
      sourceService,
      relatedId,
    });

    await publishRealtimeNotification(recipientId, notification);

    if (EMAIL_REQUIRED_TYPES.includes(type)) {
      try {
        logger.warn("Email required but recipient email not resolved yet", { type, recipientId });
      } catch (error) {
        logger.error("Email send failed", { error, recipientId });
        await Notification.findByIdAndUpdate(notification._id, { emailStatus: "FAILED" });
      }
    }

    logger.info("Notification processed", { type, recipientId });
  },
  { connection }
);

notificationWorker.on("completed", (job) => {
  logger.info(`Notification job completed: ${job.id}`);
});

notificationWorker.on("failed", (job, err) => {
  logger.error(`Notification job failed: ${job?.id}`, { error: err.message });
});