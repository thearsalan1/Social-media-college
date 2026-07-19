import Redis from "ioredis";
const redis = new Redis();
console.log(redis.status);
