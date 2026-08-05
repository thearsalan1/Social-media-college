import { NextFunction, Request, Response } from "express";
import { connection as redis } from "../config/redis.js";

interface RateLimitOptions {
  windowInSeconds: number;
  maxRequests: number;
  prefix?: string;
}

export const createRateLimiter = ({ windowInSeconds, maxRequests, prefix = "rate-limit" }: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.ip || "unknown";
      const key = `${prefix}:${userId}`;

      const requests = await redis.incr(key);
      if (requests === 1) {
        await redis.expire(key, windowInSeconds);
      }

      if (requests > maxRequests) {
        const ttl = await redis.ttl(key);
        return res.status(429).json({ success: false, message: "Too many requests", retryAfter: ttl });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};