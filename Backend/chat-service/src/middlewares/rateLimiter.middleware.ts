import { NextFunction, Request, Response } from "express";
import { connection as redis } from "../config/redis.js";

interface RateLimitOption {
  windowInSeconds: number;
  maxRequests: number;
  prefix?: string;
}

export const createRateLimiter = ({
  windowInSeconds,
  maxRequests,
  prefix = "rate-limit",
}: RateLimitOption) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.ip || "Unknown";
      const key = `${prefix}:${userId}`;
      const requests = await redis.incr(key);
      if (requests === 1) {
        await redis.expire(key, windowInSeconds);
      }
      const ttl = await redis.ttl(key);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - requests),
      );
      res.setHeader("X-RateLimit-Reset", ttl);
      if (requests > maxRequests) {
        return res.status(429).json({
          success: false,
          message: "Too many requests",
          retryAfter: ttl,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
