import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import { Notification } from "../models/notification.model.js";
import { generateTitle, generateMessage } from "../utils/notification-text.js";
import { publishRealtimeNotification } from "../utils/publishRealTime.js";
import { sendEmail } from "../utils/sendEmail.js";
import { fetchUsersFromAuth } from "../utils/fetchUsersFromAuth.js";
import { logger } from "../config/logger.js";

const EMAIL_REQUIRED_TYPES = ["NEW_ANNOUNCEMENT", "CONTENT_AUTO_HIDDEN"];

async function processForUser(recipientId: string, recipientEmail: string | null, type: string, data: any) {
  const notification = await Notification.create({
    recipientId,
    type,
    title: generateTitle(type, data),
    message: generateMessage(type, data),
    sourceService: data.sourceService,
    relatedId: data.relatedId,
  });

  await publishRealtimeNotification(recipientId, notification);

  if (EMAIL_REQUIRED_TYPES.includes(type) && recipientEmail) {
    try {
      await sendEmail({
        toEmail: recipientEmail,
        subject: generateTitle(type, data),
        htmlContent: `<p>${generateMessage(type, data)}</p>`,
      });
      await Notification.findByIdAndUpdate(notification._id, { emailStatus: "SENT" });
    } catch (error) {
      logger.error("Email send failed", { error, recipientId });
      await Notification.findByIdAndUpdate(notification._id, { emailStatus: "FAILED" });
    }
  }
}

export const notificationWorker = new Worker(
  "notification-events",
  async (job) => {
    const { type, recipientId, sourceService, relatedId, collegeName, branch, ...data } = job.data;

    if (type === "NEW_ANNOUNCEMENT" && collegeName) {
      const students = await fetchUsersFromAuth(collegeName, branch);
      const batchSize = 100;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        await Promise.all(
          batch.map((student) =>
            processForUser(student.id, student.email, type, { ...data, sourceService, relatedId })
          )
        );
      }
      logger.info("Bulk announcement notification processed", { collegeName, branch, count: students.length });
      return;
    }

    if (recipientId === "ADMIN" && data.collegeName) {
      const admins = await fetchUsersFromAuth(data.collegeName, undefined, "ADMIN");
      await Promise.all(
        admins.map((admin) => processForUser(admin.id, admin.email, type, { ...data, sourceService, relatedId }))
      );
      logger.info("Admin notification processed", { count: admins.length });
      return;
    }

    if (!recipientId) {
      logger.warn("Notification job missing recipientId, skipping", { type });
      return;
    }

    await processForUser(recipientId, null, type, { ...data, sourceService, relatedId });
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