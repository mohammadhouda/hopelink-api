import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin/index.js";
import charityRoutes from "./routes/charity/index.js";
import userRoutes from "./routes/user/index.js";

import authMiddleware from "./middlewares/auth.js";
import restrictTo from "./middlewares/restrictTo.js";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());
app.use(cookieParser());
app.use(express.json());
app.use(helmet());

// ── Shared routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRouter);

// ── Admin portal
app.use("/api/admin", authMiddleware, restrictTo("ADMIN"), adminRoutes);

// ── Charity portal
app.use("/api/charity", authMiddleware, restrictTo("CHARITY"), charityRoutes);

// ── User portal
app.use("/api/user", authMiddleware, restrictTo("USER"), userRoutes);

export default app;
