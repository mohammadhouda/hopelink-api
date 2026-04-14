import express from "express";
import * as ctrl from "../../controllers/charity/rating.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getRatingsGiven);
router.post("/", ctrl.rateVolunteer);

export default router;
