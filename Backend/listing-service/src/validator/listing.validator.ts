import z from "zod";
import { ItemCategory, targetType } from "../types/types.js";

export const createMarketplaceSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(50).max(300),
    price: z.number().min(10).max(10000),
    category: z.enum(ItemCategory)
})

export const createSocialPostSchema = z.object({
    content: z.string().min(5).max(500),
});

export const createCommentSchema = z.object({
    content: z.string().min(1).max(300),
    targetType: z.enum(targetType),
    targetId: z.string().min(1),
});

export const toggleLikeSchema = z.object({
    targetType: z.enum(targetType),
    targetId: z.string().min(1),
});

export const reportSchema = z.object({
    targetType: z.enum(targetType).or(z.literal("COMMENT")),
    targetId: z.string().min(1),
    reason: z.string().max(200).optional(),
});

export type CreateMarketplaceInput = z.infer<typeof createMarketplaceSchema>;
export type CreateSocialPostInput = z.infer<typeof createSocialPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;