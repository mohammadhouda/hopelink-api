import express from "express";
import {
  registrationReport,
  ngoReport,
  userReport,
  projectReport,
  filterOptions,
} from "../../controllers/admin/reports.controller.js";

const router = express.Router();

router.get("/registration", registrationReport);
router.get("/ngos", ngoReport);
router.get("/users", userReport);
router.get("/projects", projectReport);
router.get("/filters", filterOptions);

export default router;