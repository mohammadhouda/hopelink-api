import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as profileService from "../../services/user/profile.service.js";

export const getProfile = asyncHandler(async (req, res) => {
  const data = await profileService.getProfile(req.user.id);
  return success(res, data);
});

export const getRatingsReceived = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await profileService.getRatingsReceived(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });
  return success(res, data);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await profileService.updateProfile(req.user.id, req.body);
  return success(res, data, "Profile updated");
});

export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return failure(res, "skills must be an array", 400);
  const data = await profileService.updateSkills(req.user.id, skills);
  return success(res, data, "Skills updated");
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  if (!Array.isArray(preferences)) return failure(res, "preferences must be an array", 400);
  const data = await profileService.updatePreferences(req.user.id, preferences);
  return success(res, data, "Preferences updated");
});

export const changePassword = asyncHandler(async (req, res) => {
  await profileService.changePassword(req.user.id, req.body);
  return success(res, null, "Password changed successfully");
});
