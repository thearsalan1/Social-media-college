import { Request, Response } from "express";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { prisma } from "../db/prisma.js";
import { logger } from "../config/logger.js";

interface RosterRow {
  collegeId: string;
  officialEmail: string;
  collegeName: string;
  branch: string;
  studentName: string;
}

export const uploadRoaster = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      logger.warn("Roster upload attempted without a file");
      return res.status(400).json({
        success: false,
        message: "Csv file needed to add college students",
      });
    }
    const rows: RosterRow[] = [];
    const stream = Readable.from(req.file.buffer.toString());
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("data", (row: RosterRow) => rows.push(row))
        .on("end", () => resolve())
        .on("error", (err) => {
          reject(err);
        });
    });
    if (rows.length === 0) {
      logger.warn("Roster CSV parsed but contained no rows", {
        fileName: req.file.originalname,
      });
      return res
        .status(400)
        .json({ success: false, message: "No data is available in file" });
    }
    const result = await prisma.studentRoster.createMany({
      data: rows.map((row) => ({
        collegeId: row.collegeId,
        collegeName: row.collegeName,
        officialEmail: row.officialEmail,
        studentName: row.studentName,
        branch: row.branch,
      })),
      skipDuplicates: true,
    });
    logger.info("Roster upload completed", {
      fileName: req.file.originalname,
      totalRows: rows.length,
      imported: result.count,
      skipped: rows.length - result.count,
    });
    return res.status(201).json({
      success: true,
      message: `${result.count} students imported, ${rows.length - result.count} skipped (duplicates)`,
    });
  } catch (error) {
    logger.error("Roster upload failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Roster upload failed" });
  }
};

export const filterBranch = async (req: Request, res: Response) => {
  const { branch } = req.body;
  try {
    if (!branch) {
      return res
        .status(400)
        .json({ success: false, message: "Need branch for searching" });
    }
    const users = await prisma.user.findMany({
      where: {
        branch: branch,
      },
    });
    if (users.length === 0) {
      logger.info("Branch filter returned no users", { branch });
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }
    const filteredUsers = users.map(({ password, role, ...user }) => user);
    logger.info("Users filtered by branch", {
      branch,
      count: filteredUsers.length,
    });
    return res.status(200).json({ success: true, users: filteredUsers });
  } catch (error) {
    logger.error("Filter by branch failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to filter users by branch" });
  }
};
