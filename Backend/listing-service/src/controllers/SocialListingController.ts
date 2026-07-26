import { Request, Response } from "express";
import { SocialPost } from "../models/SocialPost.model.js";
import { logger } from "../config/logger.js";

export const createSocialPost = async (req: Request, res: Response) => {
    const { content, image } = req.body;
    const { userId, collegeName, branch, name } = req.user!
    try {
        if (!userId || !collegeName || !branch) {
            return res.status(400).json({ success: false, message: "User need to be authenticated first" })
        }
        if (!content || content.length === 0) {
            return res.status(400).json({ success: false, message: "Post cannot be empty" })
        }
        if (!image) {
            return res.status(400).json({ success: false, message: "Image is required" })
        }
        const newPost = await SocialPost.create({
            content: content,
            image: image,
            userId: userId,
            userName: name,
            collegeName: collegeName,
            branch: branch,
        })
        if (!newPost) {
            return res.status(404).json({ success: false, message: "Unable to create new post" })
        }
        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: newPost
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

export const getMyPosts = async (req: Request, res: Response) => {
    const { userId } = req.user!
    try {
        if (!userId) {
            return res.status(400).json({ success: false, message: "User id not found" })
        }
        const userPosts = await SocialPost.find({
            user_Id: userId
        })
        if (!userPosts || userPosts.length === 0) {
            return res.status(200).json({ success: true, message: "User has no posts" })
        }
        return res.status(200).json({
            success: true,
            message: "User posts fetched successfully",
            data: userPosts
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

export const getPostById = async (req: Request, res: Response) => {
    const { postId } = req.params;
    try {
        if (!postId) {
            return res.status(400).json({ success: false, message: "Post id not found" })
        }
        const post = await SocialPost.findById({ _id: postId })
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" })
        }
        return res.status(200).json({
            success: true,
            message: "Post fetched successfully",
            data: post
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

export const updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { content, image } = req.body;
    const { userId } = req.user!;
    try {
        if (!postId) {
            return res.status(400).json({ success: false, message: "Post id not found" })
        }
        if (content) {
            return res.status(400).json({ success: false, message: "Content for post not found" })
        }
        if (image) {
            return res.status(400).json({ success: false, message: "Image for post not found" })
        }
        if (!userId) {
            return res.status(400).json({ success: false, message: "User id not found" })
        }
        const post = await SocialPost.findOne({ _id: postId })
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" })
        }
        if (post.userId !== userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        if (content) {
            post.content = content
        }
        if (image) {
            post.image = image
        }
        const updatedPost = await post.save()
        return res.status(200).json({
            success: true,
            message: "Post updated successfully",
            data: updatedPost
        })
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

export const deletePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { userId } = req.user!;
    try {
        if (!postId) {
            return res.status(400).json({ success: false, message: "Post id not found" })
        }
        if (!userId) {
            return res.status(400).json({ success: false, message: "User id not found" })
        }
        const post = await SocialPost.findById({ _id: postId })
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" })
        }
        if (post.userId.toString() !== userId.toString()) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const deletedPost = await SocialPost.findByIdAndDelete({ _id: postId })
        if (!deletedPost) {
            return res.status(404).json({ success: false, message: "Post not found" })
        }
        return res.status(200).json({
            success: true,
            message: "Post deleted successfully",
            data: deletedPost
        })

    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

