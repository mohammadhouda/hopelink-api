import express from "express";
import * as ctrl from "../../controllers/charity/application.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getApplications);
router.get("/:id/applicant", ctrl.getApplicantProfile);
router.patch("/:id/approve", ctrl.approveApplication);
router.patch("/:id/decline", ctrl.declineApplication);

export default router;
