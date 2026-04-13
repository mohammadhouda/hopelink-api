import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as certificateService from "../../services/user/certificate.service.js";

export const getMyCertificates = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await certificateService.getMyCertificates(req.user.id, {
    page:  parseInt(page)  || 1,
    limit: parseInt(limit) || 10,
  });
  return success(res, result);
});

export const getCertificate = asyncHandler(async (req, res) => {
  const data = await certificateService.getCertificateById(
    req.user.id,
    parseInt(req.params.id),
  );
  return success(res, data);
});
