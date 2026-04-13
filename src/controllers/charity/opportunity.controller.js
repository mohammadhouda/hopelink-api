import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as opportunityService from "../../services/charity/opportunity.service.js";

export const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.createOpportunity(req.charityId, req.body);
  return success(res, opportunity, "Opportunity created", 201);
});

export const getOpportunities = asyncHandler(async (req, res) => {
  const { page, limit, status, projectId } = req.query;
  const result = await opportunityService.getOpportunities(req.charityId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
    projectId: projectId ? parseInt(projectId) : undefined,
  });
  return success(res, result);
});

export const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.getOpportunityById(
    req.charityId,
    parseInt(req.params.id),
  );
  return success(res, opportunity);
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.updateOpportunity(
    req.charityId,
    parseInt(req.params.id),
    req.body,
  );
  return success(res, opportunity, "Opportunity updated");
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  await opportunityService.deleteOpportunity(req.charityId, parseInt(req.params.id));
  return success(res, null, "Opportunity deleted");
});

export const endOpportunity = asyncHandler(async (req, res) => {
  const result = await opportunityService.endOpportunity(
    req.charityId,
    parseInt(req.params.id),
  );
  return success(res, result, "Opportunity ended and room closed");
});
