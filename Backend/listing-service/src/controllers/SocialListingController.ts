import { Request, Response } from "express";
import { SocialPost } from "../models/SocialPost.model.js";
import { logger } from "../config/logger.js";
import {
  deleteFromCloudinary,
  uploadMultipleImages,
} from "../utils/uploadToCloudinary.js";

export const createSocialPost = async (req: Request, res: Response) => {
  const { content } = req.body;
  const { userId, collegeName, branch, name } = req.user!;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    if (!userId || !collegeName || !branch || !name) {
      return res.status(400).json({
        success: false,
        message: "User need to be authenticated first",
      });
    }
    if (!content || content.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Post cannot be empty" });
    }
    if (!files || files.length <= 0) {
      return res.status(404).json({ success: false, message: "Image needed" });
    }

    let images: { url: string; publicId: string }[] = [];
    if (files && files.length > 0) {
      images = await uploadMultipleImages(files, "social-posts");
    }

    const newPost = await SocialPost.create({
      content,
      images,
      userId,
      userName: name,
      collegeName,
      branch,
    });

    if (!newPost) {
      return res
        .status(404)
        .json({ success: false, message: "Unable to create new post" });
    }

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMyPosts = async (req: Request, res: Response) => {
  const { userId } = req.user!;
  try {
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User id not found" });
    }
    const userPosts = await SocialPost.find({
      userId: userId,
    });
    if (!userPosts || userPosts.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "User has no posts" });
    }
    return res.status(200).json({
      success: true,
      message: "User posts fetched successfully",
      data: userPosts,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post id not found" });
    }
    const post = await SocialPost.findOne({
      _id: postId,
      collegeName: req.user!.collegeName,
      ishidden: false,
    });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: post,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    if (!content && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Provide content or image to update",
      });
    }

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const updateData: Record<string, any> = {};

    if (content) {
      updateData.content = content;
    }

    if (files && files.length > 0) {
      if (post.images && post.images.length > 0) {
        for (const img of post.images) {
          await deleteFromCloudinary(img.publicId);
        }
      }

      const uploadedImages = await uploadMultipleImages(files, "social-posts");
      updateData.images = uploadedImages;
    }

    const updatedPost = await SocialPost.findOneAndUpdate(
      { _id: postId },
      updateData,
      { new: true },
    );

    if (!updatedPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    logger.info("Post updated", { postId });
    return res.status(200).json({ success: true, post: updatedPost });
  } catch (error) {
    logger.error("Update post failed", { error });
    return res
      .status(500)
      .json({ success: false, message: "Failed to update post" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { userId } = req.user!;

  try {
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "Post id not found" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User id not found" });
    }

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        await deleteFromCloudinary(img.publicId);
      }
    }

    const deletedPost = await SocialPost.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: deletedPost,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { branch, userId, page, limit } = req.query;

    const filter: Record<string, any> = {
      collegeName: req.user!.collegeName,
      ishidden: false,
    };

    if (branch) filter.branch = branch;
    if (userId) filter.userId = userId;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, parseInt(limit as string) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      SocialPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      SocialPost.countDocuments(filter),
    ]);
    logger.info(`Data found ${posts.length}`, posts);
    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
      },
    });
  } catch (error) {
    logger.error("Get all posts failed", { error });
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch posts" });
  }
};
