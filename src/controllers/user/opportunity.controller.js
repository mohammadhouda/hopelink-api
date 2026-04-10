import { success, failure } from "../../utils/response.js";
import * as opportunityService from "../../services/user/opportunity.service.js";

export async function getOpportunities(req, res) {
  try {
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
  } catch (err) {
    return failure(res, err.message || "Failed to fetch opportunities", err.status || 500);
  }
}

export async function getOpportunity(req, res) {
  try {
    const data = await opportunityService.getOpportunityById(parseInt(req.params.id), req.user.id);
    return success(res, data);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch opportunity", err.status || 500);
  }
}
