import express from "express";
import { getCharityAnalytics } from "../../controllers/charity/analytics.controller.js";

const router = express.Router();

router.get("/", getCharityAnalytics);

export default router;
