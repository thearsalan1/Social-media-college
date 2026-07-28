import "dotenv/config";

import helmet from "helmet";
import express, { Request, Response } from "express";
import cors from "cors";
import { connection } from "./src/config/redis.js";
import { connectDB } from "./src/config/db.js";
import SocialListingRouter from "./src/routes/SocialListing.routes.js";
import cookieParser from "cookie-parser";
import marketplaceRoutes from "./src/routes/marketPlace.routes.js";
import commentsRoutes from "./src/routes/Comments.route.js";
import likeRoutes from "./src/routes/like.routes.js";
import reportRoutes from "./src/routes/report.routes.js";

const app = express();
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use("/listings", SocialListingRouter);
app.use("/listings", marketplaceRoutes);
app.use("/listings", commentsRoutes);
app.use("/listings", likeRoutes);
app.use("/listings", reportRoutes);

app.use("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: "listing-service is running " });
});

connectDB();
connection;

const PORT = process.env.PORT || "5002";
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:5002`);
});
