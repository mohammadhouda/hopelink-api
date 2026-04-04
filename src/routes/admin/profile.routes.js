import express from "express";
import * as ctrl from "../../controllers/admin/profile.controller.js";
import authenticate from "../../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", ctrl.getProfile);
router.put("/", ctrl.updateProfile);
router.put("/avatar", ctrl.updateAvatar);
router.put("/password", ctrl.changePassword);

export default router;
