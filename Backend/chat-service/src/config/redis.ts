import { Redis } from "ioredis";

export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("connect", () => {
  console.log("Redis connected");
});
connection.on("error", (error) => {
  console.log("Redis error: ", error);
});
