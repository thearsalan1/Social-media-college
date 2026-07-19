import { connection } from "../config/redis.js";
import { Queue } from "bullmq";

export const emailQueue = new Queue("email", {
  connection: connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 500,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
