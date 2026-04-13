import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as opportunityService from "../../services/user/opportunity.service.js";

export const getOpportunities = asyncHandler(async (req, res) => {
  const { page, limit, status, category, city, search } = req.query;
  const result = await opportunityService.getOpportunities(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
    category,
    city,
    search,
  });
  return success(res, result);
});

export const getOpportunity = asyncHandler(async (req, res) => {
  const data = await opportunityService.getOpportunityById(
    parseInt(req.params.id),
    req.user.id,
  );
  return success(res, data);
});
