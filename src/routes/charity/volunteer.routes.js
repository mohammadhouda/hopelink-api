import express from "express";
import * as ctrl from "../../controllers/charity/volunteer.controller.js";

const router = express.Router();

router.get("/", ctrl.getVolunteers);
router.get("/:id", ctrl.getVolunteerDetails);
router.delete("/:id", ctrl.removeVolunteer);
router.post("/:id/email", ctrl.sendEmailToVolunteer);

export default router;
