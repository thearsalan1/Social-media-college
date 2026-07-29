import { NextFunction, Request, Response } from "express";

export const scopeToMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  req.collegeFilter = { collegeName: req.user.collegeName };
  next();
};

declare global {
  namespace Express {
    interface Request {
      collegeFilter?: { collegeName: string };
    }
  }
}
