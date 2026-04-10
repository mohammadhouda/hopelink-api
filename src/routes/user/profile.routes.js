import express from "express";
import * as ctrl from "../../controllers/user/profile.controller.js";

const router = express.Router();

router.get("/", ctrl.getProfile);
router.patch("/", ctrl.updateProfile);
router.patch("/skills", ctrl.updateSkills);
router.patch("/preferences", ctrl.updatePreferences);
router.patch("/password", ctrl.changePassword);

export default router;
