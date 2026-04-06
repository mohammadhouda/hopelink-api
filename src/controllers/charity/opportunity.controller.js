import { success, failure } from "../../utils/response.js";
import * as opportunityService from "../../services/charity/opportunity.service.js";

export async function createOpportunity(req, res) {
  try {
    const charityId = req.charityId;
    const opportunity = await opportunityService.createOpportunity(charityId, req.body);
    return success(res, opportunity, "Opportunity created", 201);
  } catch (err) {
    return failure(res, err.message || "Failed to create opportunity", err.status || 500);
  }
}

export async function getOpportunities(req, res) {
  try {
    const charityId = req.charityId;
    const { page, limit, status } = req.query;
    const result = await opportunityService.getOpportunities(charityId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch opportunities", err.status || 500);
  }
}

export async function getOpportunity(req, res) {
  try {
    const charityId = req.charityId;
    const opportunity = await opportunityService.getOpportunityById(charityId, parseInt(req.params.id));
    return success(res, opportunity);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch opportunity", err.status || 500);
  }
}

export async function updateOpportunity(req, res) {
  try {
    const charityId = req.charityId;
    const opportunity = await opportunityService.updateOpportunity(charityId, parseInt(req.params.id), req.body);
    return success(res, opportunity, "Opportunity updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update opportunity", err.status || 500);
  }
}

export async function deleteOpportunity(req, res) {
  try {
    const charityId = req.charityId;
    await opportunityService.deleteOpportunity(charityId, parseInt(req.params.id));
    return success(res, null, "Opportunity deleted");
  } catch (err) {
    return failure(res, err.message || "Failed to delete opportunity", err.status || 500);
  }
}

export async function endOpportunity(req, res) {
  try {
    const charityId = req.charityId;
    const result = await opportunityService.endOpportunity(charityId, parseInt(req.params.id));
    return success(res, result, "Opportunity ended and room closed");
  } catch (err) {
    return failure(res, err.message || "Failed to end opportunity", err.status || 500);
  }
}
