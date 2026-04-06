import express from "express";
import * as ctrl from "../../controllers/charity/opportunity.controller.js";

const router = express.Router();

router.get("/", ctrl.getOpportunities);
router.post("/", ctrl.createOpportunity);
router.get("/:id", ctrl.getOpportunity);
router.patch("/:id", ctrl.updateOpportunity);
router.delete("/:id", ctrl.deleteOpportunity);
router.patch("/:id/end", ctrl.endOpportunity);

export default router;
