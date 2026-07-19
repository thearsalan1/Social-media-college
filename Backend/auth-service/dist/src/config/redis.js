import { default as Redis } from "ioredis";
export const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});
connection.on("connect", () => {
    console.log("Redis connected");
});
connection.on("error", (err) => {
    console.log("Redis error: ", err);
});
