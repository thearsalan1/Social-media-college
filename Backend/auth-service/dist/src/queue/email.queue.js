import { connection } from "../config/redis.ts";
import { Queue } from "bullmq";
export const emailQueue = new Queue("email", {
    connection: connection,
});
