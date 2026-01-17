import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import charityRoutes from "./routes/charity.routes.js";
import userRoutes from "./routes/user.route.js";
import authMiddleware from "./middlewares/auth.js";
import restrictTo from "./middlewares/restrictTo.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

// Middleware

app.use(cors({
  origin: process.env.ORIGIN_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());
app.use(helmet());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", authMiddleware, restrictTo("ADMIN"), profileRoutes);
app.use("/api/charities", authMiddleware, restrictTo("ADMIN"), charityRoutes);
app.use("/api/users", authMiddleware, restrictTo("ADMIN"), userRoutes);

export default app;

