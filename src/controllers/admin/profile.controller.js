import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as profileService from "../../services/admin/profile.service.js";
import deleteFileService from "../../services/upload.service.js";

function getIp(req) {
  return req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
}

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  return success(res, profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city, country, bio } = req.body;
  if (!name?.trim()) return failure(res, "Name is required", 400);
  const profile = await profileService.updateProfile(
    req.user.id,
    { name, phone, city, country, bio },
    { ip: getIp(req) },
  );
  return success(res, profile);
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;
  const currentAvatarUrl = await profileService.getAvatarUrl(req.user.id);
  if (currentAvatarUrl) {
    // Best-effort delete — log but don't fail the request.
    try {
      await deleteFileService(currentAvatarUrl, "logos");
    } catch (err) {
      console.error("Failed to delete old avatar:", err.message);
    }
  }
  const updated = await profileService.updateAvatar(req.user.id, avatarUrl);
  return success(res, updated);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return failure(res, "Current and new password are required", 400);
  }
  const result = await profileService.changePassword(
    req.user.id,
    { currentPassword, newPassword },
    { ip: getIp(req) },
  );
  return success(res, result);
});
