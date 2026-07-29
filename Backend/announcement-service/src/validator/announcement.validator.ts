import z from "zod";
import { AnnouncementType } from "../types/types.js";

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(300),
  type: z.nativeEnum(AnnouncementType),

  branch: z.string().optional(),
  expiresAt: z.date().optional(),
  attachments: z.array(z.string()).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(100),
});

export type createAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type createCommentInput = z.infer<typeof createCommentSchema>;
