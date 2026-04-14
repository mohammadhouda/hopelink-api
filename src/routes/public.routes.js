import express from "express";
import { statsController, submitRegistrationController } from "../controllers/public.controller.js";

const router = express.Router();

router.get("/stats",        statsController);
router.post("/registration", submitRegistrationController);

export default router;
