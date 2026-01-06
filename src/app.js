import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import charityRoutes from "./routes/charity.routes.js";
import userRoutes from "./routes/user.route.js";
import authMiddleware from "./middlewares/auth.js";
import restrictTo from "./middlewares/restrictTo.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", authMiddleware, restrictTo("ADMIN"), profileRoutes);
app.use("/api/charities", authMiddleware, restrictTo("ADMIN"), charityRoutes);
app.use("/api/users", authMiddleware, restrictTo("ADMIN"), userRoutes);

export default app;

