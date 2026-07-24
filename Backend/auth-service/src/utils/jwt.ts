import { randomUUID } from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import ms from "ms"; // optional if you want to validate

interface TokenPayload {
  userId: string;
  role: string;
  collegeId: string;
  branch: string;
  collegeName: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not defined");

  const expiresIn: SignOptions["expiresIn"] =
    (process.env.JWT_ACCESS_EXPIRES_IN as ms.StringValue) || "15m";

  return jwt.sign(payload, secret, { expiresIn });
}

export const generateRefreshToken = (payload: TokenPayload) => {
  const jti = randomUUID();
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET not defined");

  const expiresIn: SignOptions["expiresIn"] = "7d";

  const token = jwt.sign({ ...payload, jti }, secret, { expiresIn });
  return { token, jti };
};

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not defined");
  return jwt.verify(token, secret) as TokenPayload;
}

export function generateOtp() {
  const otp = Math.floor(Math.random() * 900000 + 100000);
  return otp.toString();
}

export function verifyRefreshToken(
  token: string,
): TokenPayload & { jti: string } {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET not defined");
  return jwt.verify(token, secret) as TokenPayload & { jti: string };
}
