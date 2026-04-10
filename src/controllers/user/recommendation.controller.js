import { success, failure } from "../../utils/response.js";
import { getRecommendations } from "../../services/user/recommendation.service.js";

export async function getRecommendationsController(req, res) {
  try {
    const { limit } = req.query;
    const result = await getRecommendations(req.user.id, { limit: parseInt(limit) || 10 });
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch recommendations", err.status || 500);
  }
}
