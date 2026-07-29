import { Redis } from "ioredis";
import { logger } from "./logger";
export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("connect", () => {
  logger.info("redis connected");
});

connection.on("error", (err) => {
  logger.error("Redis error: ", err);
});
