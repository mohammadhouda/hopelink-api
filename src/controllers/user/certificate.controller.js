import { success, failure } from "../../utils/response.js";
import * as certificateService from "../../services/user/certificate.service.js";

export async function getMyCertificates(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await certificateService.getMyCertificates(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch certificates", err.status || 500);
  }
}

export async function getCertificate(req, res) {
  try {
    const data = await certificateService.getCertificateById(req.user.id, parseInt(req.params.id));
    return success(res, data);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch certificate", err.status || 500);
  }
}
