import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests" },
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API Gateway running" });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    cookieDomainRewrite: { "*": "" },
    pathRewrite: (path) => `/auth${path}`,
  }),
);

app.use(
  "/listings",
  createProxyMiddleware({
    target: process.env.LISTING_SERVICE_URL,
    changeOrigin: true,
    cookieDomainRewrite: { "*": "" },
    pathRewrite: (path) => `/listing${path}`,
  }),
);

app.use(
  "/announcements",
  createProxyMiddleware({
    target: process.env.ANNOUNCEMENT_SERVICE_URL,
    changeOrigin: true,
    cookieDomainRewrite: { "*": "" },
    pathRewrite: (path) => `/announcement${path}`,
  }),
);

app.use(
  "/chat",
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL,
    changeOrigin: true,
    cookieDomainRewrite: { "*": "" },
    ws: true,
    pathRewrite: (path) => `/chat${path}`,
  }),
);

app.use(
  "/notifications",
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    cookieDomainRewrite: { "*": "" },
    pathRewrite: (path) => `/notification${path}`,
  }),
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});
