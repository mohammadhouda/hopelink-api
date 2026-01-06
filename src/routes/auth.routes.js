import express from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  logoutAllController
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.post("/logout-all", authMiddleware, logoutAllController);

export default router;