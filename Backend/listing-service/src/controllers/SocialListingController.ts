import { NextFunction, Request, Response } from "express";

export const createSocialPost = async (req: Request, res: Response, next: NextFunction) => {
    const { content, image } = req.body;
    const { userId, collegeName, branch,name } = req.user!
    if (!userId || !collegeName || !branch) {
        return res.status(400).json({ success: false, message: "User need to be authenticated first" })
    }
    if (!content || content.length === 0) {
        return res.status(400).json({ success: false, message: "Post cannot be empty" })
    }
    if (!image) {
        return res.status(400).json({ success: false, message: "Image is required" })
    }
}