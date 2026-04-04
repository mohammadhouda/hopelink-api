import express from "express";
import { getStats } from "../../controllers/admin/dashboard.controller.js";

const router = express.Router();

router.get("/stats", getStats);

export default router;