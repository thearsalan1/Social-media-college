import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
interface TokenPayload {
  userId: string;
  role: string;
  collegeId: string;
  branch: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

export const generateRefreshToken = (payload: TokenPayload) => {
  const jti = randomUUID();

  const token = jwt.sign(
    {
      ...payload,
      jti,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "7d",
    },
  );

  return {
    token,
    jti,
  };
};

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
}

export function generateOtp() {
  const otp = Math.floor(Math.random() * 900000 + 100000);
  return otp.toString();
}
