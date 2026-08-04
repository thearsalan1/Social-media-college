import { connection } from "./../config/redis";
import { Queue } from "bullmq";

export const notificationQueue = new Queue("notification-events", {
  connection,
});
