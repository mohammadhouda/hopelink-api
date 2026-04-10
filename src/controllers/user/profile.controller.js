import { success, failure } from "../../utils/response.js";
import * as profileService from "../../services/user/profile.service.js";

export async function getProfile(req, res) {
  try {
    const data = await profileService.getProfile(req.user.id);
    return success(res, data);
  } catch (err) {
    return failure(res, err.message || "Failed to fetch profile", err.status || 500);
  }
}

export async function updateProfile(req, res) {
  try {
    const data = await profileService.updateProfile(req.user.id, req.body);
    return success(res, data, "Profile updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update profile", err.status || 500);
  }
}

export async function updateSkills(req, res) {
  try {
    const { skills } = req.body;
    if (!Array.isArray(skills)) return failure(res, "skills must be an array", 400);
    const data = await profileService.updateSkills(req.user.id, skills);
    return success(res, data, "Skills updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update skills", err.status || 500);
  }
}

export async function updatePreferences(req, res) {
  try {
    const { preferences } = req.body;
    if (!Array.isArray(preferences)) return failure(res, "preferences must be an array", 400);
    const data = await profileService.updatePreferences(req.user.id, preferences);
    return success(res, data, "Preferences updated");
  } catch (err) {
    return failure(res, err.message || "Failed to update preferences", err.status || 500);
  }
}

export async function changePassword(req, res) {
  try {
    await profileService.changePassword(req.user.id, req.body);
    return success(res, null, "Password changed successfully");
  } catch (err) {
    return failure(res, err.message || "Failed to change password", err.status || 500);
  }
}
