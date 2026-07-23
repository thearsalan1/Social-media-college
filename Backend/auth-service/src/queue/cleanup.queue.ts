import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const cleanupQueue = new Queue("cleanup-jobs", { connection });

export async function scheduleCleanup() {
  await cleanupQueue.add(
    "cleanup-unverified-users",
    {},
    { repeat: { pattern: "0 0 * * *" } },
  );
}
