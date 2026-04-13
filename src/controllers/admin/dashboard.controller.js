import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getDashboardStats } from "../../services/admin/dashboard.service.js";

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  return success(res, stats);
});
