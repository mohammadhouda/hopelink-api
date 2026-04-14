import express from "express";
import * as ctrl from "../../controllers/charity/project.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getProjects);
router.post("/", ctrl.createProject);
router.get("/:id", ctrl.getProject);
router.patch("/:id", ctrl.updateProject);
router.delete("/:id", ctrl.deleteProject);

export default router;
