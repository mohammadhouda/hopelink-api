// routes/auth.routes.js
import express from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  logoutAllController,
  getSessionsController,
  revokeSessionController
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", rateLimiter, registerController);
router.post("/login", rateLimiter, loginController);
router.post("/refresh", rateLimiter, refreshController);
router.post("/logout", logoutController);
router.post("/logout-all", authMiddleware, logoutAllController);

// Session management
router.get("/sessions", authMiddleware, getSessionsController);
router.delete("/sessions/:sessionId", authMiddleware, revokeSessionController);

export default router;