import "express";
declare global {
  namespace Express {
    interface Request {
      user?: {
        name: string;
        userId: string;
        collegeId: string;
        collegeName: string;
        role: string;
        branch: string;
      };
    }
  }
}
