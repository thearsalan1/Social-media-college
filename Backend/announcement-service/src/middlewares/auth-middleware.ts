import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        collegeId: string;
        collegeName: string;
        branch: string;
        name: string;
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as any;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}