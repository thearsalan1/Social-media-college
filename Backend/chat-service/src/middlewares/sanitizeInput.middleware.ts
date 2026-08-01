import { Request, Response, NextFunction } from "express";
import sanitizeHtml from "sanitize-html";

export function sanitizeInput(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === "string") {
        req.body[field] = sanitizeHtml(req.body[field], {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    }
    next();
  };
}
