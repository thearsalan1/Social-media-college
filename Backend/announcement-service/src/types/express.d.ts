import "express";

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
      collegeFilter?: { collegeName: string };
    }
  }
}