import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const notificationQueue = new Queue("notification-event", {
  connection,
  defaultJobOptions: {
    backoff: { type: "exponential", delay: 500 },
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
