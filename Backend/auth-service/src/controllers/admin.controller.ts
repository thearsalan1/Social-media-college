import { Request, Response } from "express";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { prisma } from "../db/prisma.js";

interface RosterRow {
  collegeId: string;
  officialEmail: string;
  branch: string;
  studentName: string;
}

export const uploadRoaster = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
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
      return res
        .status(400)
        .json({ success: false, message: "No data is available in file" });
    }
    const result = await prisma.studentRoster.createMany({
      data: rows.map((row) => ({
        collegeId: row.collegeId,
        officialEmail: row.officialEmail,
        studentName: row.studentName,
        branch: row.branch,
      })),
      skipDuplicates: true,
    });
    return res.status(201).json({
      success: true,
      message: `${result.count} students imported, ${rows.length - result.count} skipped (duplicates)`,
    });
  } catch (error) {
    console.log(error);
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
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }
    const filteredUsers = users.map(({ password, role, ...user }) => user);
    return res.status(200).json({ success: true, users: filteredUsers });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to filter users by branch" });
  }
};
