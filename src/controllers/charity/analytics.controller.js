import { success, failure } from "../../utils/response.js";
import { getAnalytics } from "../../services/charity/analytics.service.js";

export async function getCharityAnalytics(req, res) {
  try {
    const result = await getAnalytics(req.charityId);
    return success(res, result);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch analytics", err.status || 500);
  }
}
