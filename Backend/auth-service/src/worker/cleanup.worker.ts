import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../config/logger.js";

export const cleanupWorker = new Worker(
  "cleanup-jobs",
  async (job) => {
    if (job.name === "cleanup-unverified-users") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const unverifiedUsers = await prisma.user.findMany({
        where: { isVerified: false, createdAt: { lt: twentyFourHoursAgo } },
      });

      for (const user of unverifiedUsers) {
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.studentRoster.update({
          where: { collegeId: user.collegeId },
          data: { isRegistered: false },
        });
      }

      logger.info(
        `Cleanup: ${unverifiedUsers.length} unverified users removed`,
      );
    }
  },
  { connection },
);
