import { success, failure } from "../../utils/response.js";
import * as applicationService from "../../services/charity/application.service.js";

export async function getApplications(req, res) {
  try {
    const charityId = req.charityId;
    const { page, limit, status, opportunityId } = req.query;
    const result = await applicationService.getApplications(charityId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch applications", err.status || 500);
  }
}

export async function approveApplication(req, res) {
  try {
    const charityId = req.charityId;
    const result = await applicationService.approveApplication(charityId, parseInt(req.params.id));
    return success(res, result, "Application approved and volunteer added to room");
  } catch (err) {
    return failure(res, err.message || "Failed to approve application", err.status || 500);
  }
}

export async function declineApplication(req, res) {
  try {
    const charityId = req.charityId;
    const { reason } = req.body;
    const result = await applicationService.declineApplication(charityId, parseInt(req.params.id), { reason });
    return success(res, result, "Application declined");
  } catch (err) {
    return failure(res, err.message || "Failed to decline application", err.status || 500);
  }
}
