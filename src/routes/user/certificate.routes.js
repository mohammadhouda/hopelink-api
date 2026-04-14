import express from "express";
import * as ctrl from "../../controllers/user/certificate.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getMyCertificates);
router.get("/:id", ctrl.getCertificate);

export default router;
