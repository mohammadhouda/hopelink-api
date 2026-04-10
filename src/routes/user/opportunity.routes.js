import express from "express";
import * as ctrl from "../../controllers/user/opportunity.controller.js";

const router = express.Router();

router.get("/", ctrl.getOpportunities);
router.get("/:id", ctrl.getOpportunity);

export default router;
