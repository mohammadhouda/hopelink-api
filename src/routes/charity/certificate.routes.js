import express from "express";
import * as ctrl from "../../controllers/charity/certificate.controller.js";
import { parsePagination } from "../../middlewares/parsePagination.js";

const router = express.Router();

router.get("/", parsePagination(), ctrl.getCertificatesIssued);
router.post("/", ctrl.issueCertificate);
router.post("/bulk/:opportunityId", ctrl.bulkIssueCertificates);

export default router;
