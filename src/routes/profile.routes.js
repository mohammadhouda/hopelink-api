import express from "express";
import { getProfileController, updateProfileController } from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/me", getProfileController);
router.put("/me", updateProfileController);

export default router;