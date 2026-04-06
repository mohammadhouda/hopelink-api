import { success, failure } from "../../utils/response.js";
import * as profileService from "../../services/charity/profile.service.js";

export async function getProfile(req, res) {
  try {
    const profile = await profileService.getProfile(req.user.id);
    return success(res, profile);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch profile", err.status || 500);
  }
}

export async function updateProfile(req, res) {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.body);
    return success(res, profile, "Profile updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update profile", err.status || 500);
  }
}
