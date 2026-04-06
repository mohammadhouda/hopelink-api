import express from "express";
import * as ctrl from "../../controllers/charity/profile.controller.js";

const router = express.Router();

router.get("/", ctrl.getProfile);
router.patch("/", ctrl.updateProfile);

export default router;
