import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { logger } from "../config/logger.js";

export const getStudentsForNotification = async (
  req: Request,
  res: Response,
) => {
  const { collegeName, branch, role } = req.body;

  try {
    if (!collegeName) {
      return res
        .status(400)
        .json({ success: false, message: "collegeName required" });
    }

    const filter: any = { collegeName };
    if (branch) filter.branch = branch;
    if (role) filter.role = role;

    const users = await prisma.user.findMany({
      where: filter,
      select: { id: true, email: true, name: true, role: true },
    });

    logger.info("Internal students fetch", {
      collegeName,
      branch,
      role,
      count: users.length,
    });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error("Internal students fetch failed", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
