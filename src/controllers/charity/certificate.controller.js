import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as certService from "../../services/charity/certificate.service.js";

export const issueCertificate = asyncHandler(async (req, res) => {
  const { volunteerId, opportunityId, pdfFileUrl } = req.body;
  const cert = await certService.issueCertificate(req.charityId, {
    volunteerId:   parseInt(volunteerId),
    opportunityId: parseInt(opportunityId),
    pdfFileUrl,
  });
  return success(res, cert, "Certificate issued", 201);
});

export const bulkIssueCertificates = asyncHandler(async (req, res) => {
  const result = await certService.bulkIssueCertificates(
    req.charityId,
    parseInt(req.params.opportunityId),
  );
  return success(res, result, `${result.issued} certificates issued`);
});

export const getCertificatesIssued = asyncHandler(async (req, res) => {
  const { opportunityId } = req.query;
  const result = await certService.getCertificatesIssued(req.charityId, {
    page: req.pagination.page,
    limit: req.pagination.limit,
    opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
  });
  return success(res, result);
});
