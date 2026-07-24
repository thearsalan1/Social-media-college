import { prisma } from "../db/prisma.js";
import { loginInput, signupInput } from "./../validator/auth.validator.js";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateOtp,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { emailQueue } from "../queue/email.queue.js";
import { maskedEmail } from "../utils/maskedEmail.js";
import { connection as redis } from "../config/redis.js";
import { logger } from "../config/logger.js";

export const signup = async (req: Request, res: Response) => {
  try {
    const { collegeId, name, password, collegeName }: signupInput = req.body;

    const roster = await prisma.studentRoster.findUnique({
      where: {
        collegeId,
      },
    });
    if (!roster) {
      logger.warn("Signup attempt with invalid collegeId", { collegeId });
      return res.status(404).json({
        success: false,
        message:
          "Invalid college id. Contact to your college for any information.",
      });
    }
    if (roster.isRegistered) {
      logger.warn("Signup attempt for already registered student", {
        collegeId,
      });
      return res.status(400).json({
        success: false,
        message: "Student already registered. Try to login.",
      });
    }
    if (!roster.officialEmail) {
      logger.error("Roster missing officialEmail", { collegeId });
      return res.status(404).json({
        success: false,
        message: "Students email not found.",
      });
    }
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name,
        collegeId: roster.collegeId,
        collegeName: roster.collegeName,
        email: roster.officialEmail,
        password: hashedPassword,
        branch: roster.branch,
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
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000,
    );
    await prisma.otp.create({
      data: {
        code: hashedOtp,
        collegeId: roster.collegeId,
        collegeName: roster.collegeName,
        userId: newUser.id,
        expiresAt,
      },
    });

    await emailQueue.add("send-signup-email", {
      email: roster.officialEmail,
      name: newUser.name,
      otp: otp,
    });
    logger.info("User signup successful", { collegeId, userId: newUser.id });
    return res.status(201).json({
      success: true,
      message: "Account created. OTP sent to your college email.",
      maskedEmail: maskedEmail(roster.officialEmail),
    });
  } catch (error) {
    logger.error("Signup error:", error);
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
      logger.warn("OTP verify attempt for non-existent user", { collegeId });
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
      logger.warn("OTP not found or expired", { collegeId, userId: user.id });
      return res.status(400).json({
        success: false,
        message: "OTP not found.",
      });
    }

    if (otpRecord.attempts >= 5) {
      logger.warn("Max OTP attempts reached", { collegeId, userId: user.id });
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
      logger.warn("Invalid OTP attempt", {
        collegeId,
        userId: user.id,
        attemptsLeft: 4 - otpRecord.attempts,
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
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN!),
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.JWT_ACCESS_EXPIRES_IN!),
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN!),
    });
    logger.info("Verification completed", { collegeId, userId: user.id });
    res.status(200).json({ success: true, message: "OTP Verified" });
  } catch (error) {
    logger.error("Verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { collegeId, password }: loginInput = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const user = await prisma.user.findUnique({
      where: {
        collegeId,
      },
    });
    if (!user) {
      logger.warn("Login attempt for non-existent user", { collegeId, ip });
      return res.status(404).json({
        success: false,
        message: "User not found. Register user first.",
      });
    }
    const isLocked = await redis.exists(`login_lock:${ip}`);
    if (isLocked) {
      const ttl = await redis.ttl(`login_lock:${ip}`);
      logger.warn("Login attempt blocked - IP locked", { collegeId, ip, ttl });

      return res.status(429).json({
        success: false,
        message: "Too many failed login attempts. Try again later.",
        retryAfter: ttl,
      });
    }
    let attempt = 0;
    if (!user.isVerified) {
      logger.warn("Login attempt for unverified user", {
        collegeId,
        userId: user.id,
      });
      return res.status(400).json({
        success: false,
        message: "User is not verified. Verify your email.",
      });
    }
    const isMatch = await bcrypt.compare(password, user?.password!);
    if (!isMatch) {
      attempt = await redis.incr(`login_attempts:${ip}`);
      if (attempt === 1) {
        await redis.expire(`login_attempts:${ip}`, 15 * 60);
      }
      if (attempt >= 5) {
        await redis.set(`login_lock:${ip}`, "locked", "EX", 15 * 60);
        await redis.del(`login_attempts:${ip}`);
        logger.warn("IP locked due to repeated failed logins", {
          collegeId,
          ip,
        });

        return res.status(429).json({
          success: false,
          message:
            "Too many failed login attempts. Try again after 15 minutes.",
        });
      }
      logger.warn("Invalid login credentials", { collegeId, ip, attempt });
      return res
        .status(404)
        .json({ success: false, message: "Invalid Credentials" });
    }

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
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN!, 10),
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN!, 10) * 1000,
    });
    logger.info("Login successful", { collegeId, userId: user.id, ip });
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user.id,
        name: user.name,
        role: user.role,
        collegeId: user.collegeId,
        branch: user.branch,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      logger.warn("Refresh token missing in request");
      return res
        .status(401)
        .json({ success: false, message: "Refresh token missing" });
    }

    const decoded = verifyRefreshToken(oldRefreshToken);

    const { userId, jti } = decoded as any;

    const storedToken = await redis.get(`refresh:${userId}:${jti}`);

    if (!storedToken || storedToken !== oldRefreshToken) {
      logger.warn("Refresh token not recognized / reuse detected", {
        userId,
        jti,
      });
      return res.status(401).json({
        success: false,
        message: "Refresh token not recognized. Please login again.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      logger.warn("Refresh token valid but user not found", { userId });
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    await redis.del(`refresh:${userId}:${jti}`);

    const newAccessToken = generateAccessToken({
      userId: user.id,
      collegeId: user.collegeId,
      branch: user.branch,
      role: user.role,
    });

    const { token: newRefreshToken, jti: newJti } = generateRefreshToken({
      userId: user.id,
      collegeId: user.collegeId,
      branch: user.branch,
      role: user.role,
    });

    await redis.set(
      `refresh:${user.id}:${newJti}`,
      newRefreshToken,
      "EX",
      process.env.JWT_REFRESH_EXPIRES_IN as string,
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info("Access token refreshed", { userId: user.id });
    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (error) {
    logger.error("Refresh token error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to refresh token" });
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { collegeId } = req.body;
    if (!collegeId) {
      logger.warn("Forget password called without collegeId");
      return res
        .status(404)
        .json({ success: false, message: "college Id required" });
    }
    const user = await prisma.user.findUnique({
      where: {
        collegeId,
      },
    });

    if (!user) {
      logger.warn("Forget password attempt for non-existent user", {
        collegeId,
      });
      return res
        .status(404)
        .json({ success: false, message: "User not found " });
    }
    const roster = await prisma.studentRoster.findUnique({
      where: {
        collegeId,
      },
    });
    if (!roster) {
      logger.error("Roster not found for existing user", {
        collegeId,
        userId: user.id,
      });
      return res.status(404).json({
        success: false,
        message:
          "Invalid collegeId, If it is correct than contact your college",
      });
    }
    const otp = generateOtp();
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000,
    );
    await prisma.otp.create({
      data: {
        code: hashedOtp,
        userId: user.id,
        collegeId: roster.collegeId,
        collegeName: roster.collegeName,
        expiresAt,
      },
    });
    await emailQueue.add("forget-password-email", {
      email: roster.officialEmail,
      name: user.name,
      otp: otp,
    });

    logger.info("Forget password OTP sent", { collegeId, userId: user.id });
    return res.status(201).json({
      success: true,
      message: "Forgot password. OTP sent to your college email.",
      maskedEmail: maskedEmail(roster.officialEmail),
    });
  } catch (error) {
    logger.error("Forget password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { newPassword, collegeId, otp } = req.body;
  try {
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required",
      });
    }

    const user = await prisma.user.findUnique({ where: { collegeId } });
    if (!user) {
      logger.warn("Reset password attempt for non-existent user", {
        collegeId,
      });
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: { userId: user.id, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) {
      logger.warn("Reset password OTP expired or not found", {
        collegeId,
        userId: user.id,
      });
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Request again.",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.code);
    if (!isOtpValid) {
      logger.warn("Reset password invalid OTP", { collegeId, userId: user.id });
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { collegeId },
      data: { password: hashedPassword, updatedAt: new Date() },
    });

    logger.info("Password reset successful", { collegeId, userId: user.id });
    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login.",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    logger.info("User logged out", { userId: (req as any).user?.userId });
    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const { collegeId } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        collegeId,
      },
    });
    const roster = await prisma.studentRoster.findUnique({
      where: {
        collegeId,
      },
    });
    if (!user) {
      logger.warn("Resend OTP attempt for non-existent user", { collegeId });
      return res.status(404).json({
        success: false,
        message: "User not found try to register first",
      });
    }
    const saltRounds = parseInt(process.env.JWT_SALT || "10", 10);
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const existingOtp = await prisma.otp.findFirst({
      where: { userId: user.id },
    });

    if (existingOtp) {
      await prisma.otp.update({
        where: { id: existingOtp.id },
        data: {
          code: hashedOtp,
          expiresAt,
          isUsed: false,
          attempts: 0,
          createdAt: new Date(),
        },
      });
    } else {
      await prisma.otp.create({
        data: {
          userId: user.id,
          code: hashedOtp,
          expiresAt,
        },
      });
    }

    await emailQueue.add("resend-forget-password-email", {
      email: roster?.officialEmail,
      name: roster?.studentName,
      otp,
    });
    logger.info("OTP resent", { collegeId, userId: user.id });
    res
      .status(200)
      .json({ success: true, message: "Otp resended to your college Email" });
  } catch (error) {
    logger.error("Resend OTP error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
