import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import charityRoutes from "./routes/charity.routes.js";
import userRoutes from "./routes/user.route.js";
import requestRoutes from "./routes/request.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import authMiddleware from "./middlewares/auth.js";
import restrictTo from "./middlewares/restrictTo.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

// Middleware

app.use(cors({
  origin: process.env.ORIGIN_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(cookieParser());
app.use(express.json());
app.use(helmet());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", authMiddleware, restrictTo("ADMIN"), profileRoutes);
app.use("/api/admin/dashboard", authMiddleware, restrictTo("ADMIN"), dashboardRoutes);
app.use("/api/admin/report", authMiddleware, restrictTo("ADMIN"), reportRoutes);
app.use("/api/charities", authMiddleware, restrictTo("ADMIN"), charityRoutes);
app.use("/api/users", authMiddleware, restrictTo("ADMIN"), userRoutes);
app.use("/api/requests", authMiddleware, restrictTo("ADMIN"), requestRoutes);
app.use("/api/upload", uploadRouter);

export default app;

