import { success, failure } from "../../utils/response.js";
import * as applicationService from "../../services/user/application.service.js";

export async function getMyApplications(req, res) {
  try {
    const { page, limit, status } = req.query;
    const result = await applicationService.getMyApplications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch applications", err.status || 500);
  }
}

export async function applyToOpportunity(req, res) {
  try {
    const opportunityId = parseInt(req.params.opportunityId);
    const data = await applicationService.applyToOpportunity(req.user.id, opportunityId, req.body);
    return success(res, data, "Application submitted successfully", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to submit application", err.status || 500);
  }
}

export async function withdrawApplication(req, res) {
  try {
    await applicationService.withdrawApplication(req.user.id, parseInt(req.params.id));
    return success(res, null, "Application withdrawn");
  } catch (err) {
    return failure(res, err.message || "Failed to withdraw application", err.status || 500);
  }
}
