import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  otpEmailTemplate,
  passwordResetEmailTemplate,
} from "../utils/emailTemplates.js";
import { logger } from "../config/logger.js";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    logger.info(`Processing email job: ${job.name}`);

    switch (job.name) {
      case "send-signup-email":
        await sendEmail({
          toEmail: job.data.email,
          subject: "CampusConnect - Verify Your Email",
          htmlContent: otpEmailTemplate(job.data.name, job.data.otp),
        });
        break;

      case "forget-password-email":
        await sendEmail({
          toEmail: job.data.email,
          subject: "CampusConnect - Reset Your Password",
          htmlContent: passwordResetEmailTemplate(job.data.name, job.data.otp),
        });
        break;

      case "resend-forget-password-email":
        await sendEmail({
          toEmail: job.data.email,
          subject: "CampusConnect - Your New OTP",
          htmlContent: otpEmailTemplate(job.data.name, job.data.otp),
        });
        break;

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  logger.info(`Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`Email job failed: ${job?.id}`, { error: err.message });
});

console.log("📨 Email Worker started...");
