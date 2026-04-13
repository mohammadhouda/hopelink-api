import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getRegistrationReport,
  getNgoReport,
  getUserReport,
  getProjectReport,
  getFilterOptions,
} from "../../services/admin/reports.service.js";

export const registrationReport = asyncHandler(async (req, res) => {
  const data = await getRegistrationReport(req.query);
  return success(res, data);
});

export const ngoReport = asyncHandler(async (req, res) => {
  const data = await getNgoReport(req.query);
  return success(res, data);
});

export const userReport = asyncHandler(async (req, res) => {
  const data = await getUserReport(req.query);
  return success(res, data);
});

export const projectReport = asyncHandler(async (req, res) => {
  const data = await getProjectReport(req.query);
  return success(res, data);
});

export const filterOptions = asyncHandler(async (req, res) => {
  const data = await getFilterOptions();
  return success(res, data);
});
