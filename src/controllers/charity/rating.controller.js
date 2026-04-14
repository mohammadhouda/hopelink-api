import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as ratingService from "../../services/charity/rating.service.js";

export const rateVolunteer = asyncHandler(async (req, res) => {
  const { volunteerId, opportunityId, rating, comment } = req.body;
  const result = await ratingService.rateVolunteer(req.charityId, {
    volunteerId:   parseInt(volunteerId),
    opportunityId: parseInt(opportunityId),
    rating:        parseInt(rating),
    comment,
  });
  return success(res, result, "Volunteer rated successfully");
});

export const getRatingsGiven = asyncHandler(async (req, res) => {
  const { opportunityId } = req.query;
  const result = await ratingService.getRatingsGiven(req.charityId, {
    page: req.pagination.page,
    limit: req.pagination.limit,
    opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
  });
  return success(res, result);
});
