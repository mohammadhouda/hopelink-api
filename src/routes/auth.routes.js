// routes/auth.routes.js
import express from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  logoutAllController,
  getSessionsController,
  revokeSessionController,
  socketTokenController,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", rateLimiter, registerController);
router.post("/login", rateLimiter, loginController);
router.post("/refresh", rateLimiter, refreshController);
router.post("/logout", authMiddleware, logoutController);
router.post("/logout-all", authMiddleware, logoutAllController);

// Session management
router.get("/sessions", authMiddleware, getSessionsController);
router.delete("/sessions/:sessionId", authMiddleware, revokeSessionController);

// Socket.IO token
router.get("/socket-token", authMiddleware, socketTokenController);

export default router;
