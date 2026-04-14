import express from "express";
import * as ctrl from "../../controllers/user/opportunity.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getOpportunities);
router.get("/:id", ctrl.getOpportunity);

export default router;
