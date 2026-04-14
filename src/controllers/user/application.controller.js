import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as applicationService from "../../services/user/application.service.js";

export const getMyApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const result = await applicationService.getMyApplications(req.user.id, {
    page: req.pagination.page,
    limit: req.pagination.limit,
    status,
  });
  return success(res, result);
});

export const applyToOpportunity = asyncHandler(async (req, res) => {
  const data = await applicationService.applyToOpportunity(
    req.user.id,
    parseInt(req.params.opportunityId),
    req.body,
  );
  return success(res, data, "Application submitted successfully", 201);
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  await applicationService.withdrawApplication(req.user.id, parseInt(req.params.id));
  return success(res, null, "Application withdrawn");
});
