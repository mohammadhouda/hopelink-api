import express from "express";
import * as ctrl from "../../controllers/user/application.controller.js";

const router = express.Router();

router.get("/", ctrl.getMyApplications);
router.post("/:opportunityId", ctrl.applyToOpportunity);
router.delete("/:id", ctrl.withdrawApplication);

export default router;
