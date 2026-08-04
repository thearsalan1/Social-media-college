import { Request, Response, NextFunction } from "express";

export function verifyInternalSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const secret = req.headers["x-internal-secret"];

  if (secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized service call" });
  }

  next();
}
