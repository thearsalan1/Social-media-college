import { prisma } from "../db/prisma.js";
import { signupInput } from "./../validator/auth.validator.js";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateOtp,
  generateRefreshToken,
} from "../utils/jwt.js";
import { emailQueue } from "../queue/email.queue.js";
import { maskedEmail } from "../utils/maskedEmail.js";
import { connection as redis } from "../config/redis.js";

export const signup = async (req: Request, res: Response) => {
  try {
    const { collegeId, name, password }: signupInput = req.body;

    const roster = await prisma.studentRoster.findUnique({
      where: {
        collegeId,
      },
    });
    if (!roster) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid college id. Contact to your college for any information.",
      });
    }
    if (roster.isRegistered) {
      return res.status(400).json({
        success: false,
        message: "Student already registered. Try to login.",
      });
    }
    if (!roster.officialEmail) {
      return res.status(404).json({
        success: false,
        message: "Students email not found.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, process.env.JWT_SALT!);

    const newUser = await prisma.user.create({
      data: {
        name,
        collegeId: roster.collegeId,
        email: roster.officialEmail,
        password: hashedPassword,
        branch: roster.collegeId,
        isVerified: false,
      },
    });

    await prisma.studentRoster.update({
      where: {
        collegeId,
      },
      data: {
        isRegistered: true,
      },
    });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, process.env.JWT_SALT!);
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000,
    );
    await prisma.otp.create({
      data: {
        code: hashedOtp,
        userId: newUser.id,
        expiresAt,
      },
    });

    await emailQueue.add("send-signup-email", {
      email: roster.officialEmail,
      name: newUser.name,
      otp: otp,
    });
    return res.status(201).json({
      success: true,
      message: "Account created. OTP sent to your college email.",
      maskedEmail: maskedEmail(roster.officialEmail),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Signup failed" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { collegeId, otp } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        collegeId,
      },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No user found. Register yourself first.",
      });
    }
    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found.",
      });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired.",
      });
    }
    if (otpRecord.isUsed) {
      return res.status(400).json({
        success: false,
        message: "Otp already used ",
      });
    }
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum attempts reached. Please request a new OTP.",
      });
    }
    const isMatch = await bcrypt.compare(otp, otpRecord.code);

    if (!isMatch) {
      await prisma.otp.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsLeft: 4 - otpRecord.attempts,
      });
    }
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isVerified: true,
        },
      }),

      prisma.otp.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          isUsed: true,
        },
      }),
    ]);
    const accessToken = generateAccessToken({
      userId: user.id,
      collegeId: user.collegeId,
      branch: user.branch,
      role: user.role,
    });

    const { token: refreshToken, jti } = generateRefreshToken({
      userId: user.id,
      collegeId: user.collegeId,
      branch: user.branch,
      role: user.role,
    });

    await redis.set(
      `refresh:${user.id}:${jti}`,
      refreshToken,
      "EX",
      process.env.JWT_REFRESH_TOKEN_IN,
    );
    res.cookie("accessToken", accessToken);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, message: "OTP Verified" });
  } catch (error) {}
};
