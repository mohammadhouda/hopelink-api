import express from "express";
import * as ctrl from "../../controllers/user/profile.controller.js";
import * as expCtrl from "../../controllers/user/experience.controller.js";

const router = express.Router();

router.get("/", ctrl.getProfile);
router.get("/ratings", ctrl.getRatingsReceived);
router.patch("/", ctrl.updateProfile);
router.patch("/skills", ctrl.updateSkills);
router.patch("/preferences", ctrl.updatePreferences);
router.patch("/password", ctrl.changePassword);

// Experience history
router.get("/experiences", expCtrl.getExperiences);
router.post("/experiences", expCtrl.addExperience);
router.put("/experiences/:id", expCtrl.updateExperience);
router.delete("/experiences/:id", expCtrl.deleteExperience);

export default router;
