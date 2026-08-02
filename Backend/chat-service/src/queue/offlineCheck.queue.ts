import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const offlineCheckQueue = new Queue("offline-message-check", {
  connection,
});

