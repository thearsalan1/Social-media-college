import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const notificationQueue = new Queue("notification-event", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 500 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
