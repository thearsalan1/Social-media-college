import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

interface SocketUser {
  userId: string;
  role: string;
  collegeId: string;
  collegeName: string;
  branch: string;
  name: string;
}

declare module "socket.io" {
  interface Socket {
    user?: SocketUser;
  }
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  try {
    const rawCookies = socket.handshake.headers.cookie;

    if (!rawCookies) {
      return next(new Error("Authentication failed: no cookies"));
    }

    const parsedCookies = cookie.parseCookie(rawCookies);
    const token = parsedCookies.accessToken;

    if (!token) {
      return next(new Error("Authentication failed: no token"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as SocketUser;
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication failed: invalid token"));
  }
}
