import { Worker } from "bullmq";
import { connection } from "../config/redis.js";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    console.log("Processing Job: ", job.name);
    console.log("Processing job data: ", job.data);
    switch (job.name) {
      case "send-signup-email":
        console.log("Sending sign up otp on email: ", job.data.email);
        break;
      case "forget-password-email":
        console.log("Sending forget password otp on email: ", job.data.email);
        break;
      case "resend-forget-password-email":
        console.log("Resending reset password otp on email: ", job.data.email);

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
  console.log("Email sending completed on job id: ", job.id);
});
emailWorker.on("failed", (job, err) => {
  console.error("Email sending failed of job id: ", job?.id);
  console.error(err);
});
console.log("📨 Email Worker started...");