import { success, failure } from "../../utils/response.js";
import * as certService from "../../services/charity/certificate.service.js";

export async function issueCertificate(req, res) {
  try {
    const { volunteerId, opportunityId, pdfFileUrl } = req.body;
    const cert = await certService.issueCertificate(req.charityId, {
      volunteerId: parseInt(volunteerId),
      opportunityId: parseInt(opportunityId),
      pdfFileUrl,
    });
    return success(res, cert, "Certificate issued", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to issue certificate", err.status || 500);
  }
}

export async function bulkIssueCertificates(req, res) {
  try {
    const result = await certService.bulkIssueCertificates(req.charityId, parseInt(req.params.opportunityId));
    return success(res, result, `${result.issued} certificates issued`);
  } catch (err) {
    return failure(res, err.message || "Failed to issue certificates", err.status || 500);
  }
}

export async function getCertificatesIssued(req, res) {
  try {
    const { page, limit, opportunityId } = req.query;
    const result = await certService.getCertificatesIssued(req.charityId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch certificates", err.status || 500);
  }
}
