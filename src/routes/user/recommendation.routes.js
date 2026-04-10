import express from "express";
import { getRecommendationsController } from "../../controllers/user/recommendation.controller.js";

const router = express.Router();

router.get("/", getRecommendationsController);

export default router;
