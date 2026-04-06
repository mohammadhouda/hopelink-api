import express from "express";
import * as ctrl from "../../controllers/charity/application.controller.js";

const router = express.Router();

router.get("/", ctrl.getApplications);
router.patch("/:id/approve", ctrl.approveApplication);
router.patch("/:id/decline", ctrl.declineApplication);

export default router;
