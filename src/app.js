import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin/index.js";
import charityRoutes from "./routes/charity/index.js";
import userRoutes from "./routes/user/index.js";
import postRoutes from "./routes/post.routes.js";

import authMiddleware from "./middlewares/auth.js";
import restrictTo from "./middlewares/restrictTo.js";
import { serverAdapter } from "./config/bullBoard.js";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/admin/queues", serverAdapter.getRouter());

app.options("*", cors());
app.use(cookieParser());
app.use(express.json());
app.use(helmet());

// ── Public routes (no auth)
app.use("/api/public", publicRoutes);

// ── Shared routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRouter);

// ── Admin portal
app.use("/api/admin", authMiddleware, restrictTo("ADMIN"), adminRoutes);

// ── Charity portal
app.use("/api/charity", authMiddleware, restrictTo("CHARITY"), charityRoutes);

// ── User portal
app.use("/api/user", authMiddleware, restrictTo("USER"), userRoutes);

// ── Community feed (accessible to users/volunteers and charities)
app.use("/api/posts", authMiddleware, restrictTo("USER", "CHARITY"), postRoutes);

export default app;
