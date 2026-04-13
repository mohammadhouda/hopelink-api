import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as applicationService from "../../services/charity/application.service.js";

export const getApplications = asyncHandler(async (req, res) => {
  const { page, limit, status, opportunityId, from, to } = req.query;
  const result = await applicationService.getApplications(req.charityId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
    opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
    from,
    to,
  });
  return success(res, result);
});

export const approveApplication = asyncHandler(async (req, res) => {
  const result = await applicationService.approveApplication(
    req.charityId,
    parseInt(req.params.id),
  );
  return success(res, result, "Application approved and volunteer added to room");
});

export const getApplicantProfile = asyncHandler(async (req, res) => {
  const result = await applicationService.getApplicantProfile(
    req.charityId,
    parseInt(req.params.id),
  );
  return success(res, result);
});

export const declineApplication = asyncHandler(async (req, res) => {
  const result = await applicationService.declineApplication(
    req.charityId,
    parseInt(req.params.id),
    { reason: req.body.reason },
  );
  return success(res, result, "Application declined");
});
