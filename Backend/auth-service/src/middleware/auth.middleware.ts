import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        collegeId: string;
        branch: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireRoles(...rolesAllowded: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !rolesAllowded.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}
