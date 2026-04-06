import express from "express";
import * as ctrl from "../../controllers/charity/rating.controller.js";

const router = express.Router();

router.get("/", ctrl.getRatingsGiven);
router.post("/", ctrl.rateVolunteer);

export default router;
