import { success } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as profileService from "../../services/charity/profile.service.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  return success(res, profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.user.id, req.body);
  return success(res, profile, "Profile updated");
});
