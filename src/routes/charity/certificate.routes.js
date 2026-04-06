import express from "express";
import * as ctrl from "../../controllers/charity/certificate.controller.js";

const router = express.Router();

router.get("/", ctrl.getCertificatesIssued);
router.post("/", ctrl.issueCertificate);
router.post("/bulk/:opportunityId", ctrl.bulkIssueCertificates);

export default router;
