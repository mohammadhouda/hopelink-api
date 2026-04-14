import express from "express";
import * as ctrl from "../../controllers/charity/volunteer.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getVolunteers);
router.get("/:id", ctrl.getVolunteerDetails);
router.delete("/:id", ctrl.removeVolunteer);
router.post("/:id/email", ctrl.sendEmailToVolunteer);

export default router;
