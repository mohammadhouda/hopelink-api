import express from "express";
import * as ctrl from "../../controllers/user/certificate.controller.js";

const router = express.Router();

router.get("/", ctrl.getMyCertificates);
router.get("/:id", ctrl.getCertificate);

export default router;
