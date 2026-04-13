import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getAnalytics } from "../../services/charity/analytics.service.js";

export const getCharityAnalytics = asyncHandler(async (req, res) => {
  const result = await getAnalytics(req.charityId);
  return success(res, result);
});
