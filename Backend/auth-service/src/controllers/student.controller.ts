import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export const getMyProfile = async (req: Request, res: Response) => {
  const id = req.user?.userId;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User id not found" });
    }
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const { password, ...data } = user;
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const { name, bio, profilePicture } = req.body;
  const id = req.user?.userId;

  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User id not found" });
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: safeUser,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const collegeId = id.toString();
  try {
    if (!collegeId) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = await prisma.user.findUnique({
      where: {
        collegeId,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { password, ...data } = user;

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
