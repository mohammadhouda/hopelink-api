import { success, failure } from "../../utils/response.js";
import * as ratingService from "../../services/charity/rating.service.js";

export async function rateVolunteer(req, res) {
  try {
    const { volunteerId, opportunityId, rating, comment } = req.body;
    const result = await ratingService.rateVolunteer(req.charityId, {
      volunteerId: parseInt(volunteerId),
      opportunityId: parseInt(opportunityId),
      rating: parseInt(rating),
      comment,
    });
    return success(res, result, "Volunteer rated successfully");
  } catch (err) {
    return failure(res, err.message || "Failed to rate volunteer", err.status || 500);
  }
}

export async function getRatingsGiven(req, res) {
  try {
    const { page, limit, opportunityId } = req.query;
    const result = await ratingService.getRatingsGiven(req.charityId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
    });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch ratings", err.status || 500);
  }
}
