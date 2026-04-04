import * as profileService from "../../services/admin/profile.service.js";
import deleteFileService from "../../services/upload.service.js";

function getIp(req) {
  return (
    req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null
  );
}

export async function getProfile(req, res) {
  try {
    const profile = await profileService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone, city, country, bio } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const profile = await profileService.updateProfile(
      req.user.id,
      { name, phone, city, country, bio },
      { ip: getIp(req) },
    );
    res.json(profile);
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function updateAvatar(req, res) {
  try {
    const { avatarUrl } = req.body;
    const userId = req.user.id;

    const currentAvatarUrl = await profileService.getAvatarUrl(userId);

    if (currentAvatarUrl) {
      console.log(
        "Deleting avatar from Supabase:",
        currentAvatarUrl,
        "bucket: logos",
      );
      try {
        const result = await deleteFileService(currentAvatarUrl, "logos");
        console.log("Delete result:", result);
      } catch (err) {
        console.error("Failed to delete old avatar:", err.message);
      }
    }

    // Update profile with new path (or empty string to clear)
    const updated = await profileService.updateAvatar(userId, avatarUrl);

    return res.json(updated);
  } catch (error) {
    console.error("updateAvatar error:", error);
    return res
      .status(500)
      .json({ error: "Failed to update avatar: " + error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    const result = await profileService.changePassword(
      req.user.id,
      { currentPassword, newPassword },
      { ip: getIp(req) },
    );
    res.json(result);
  } catch (err) {
    const clientErrors = [
      "Current password is incorrect",
      "New password must be at least 8 characters",
      "New password must be different from current password",
    ];

    if (clientErrors.includes(err.message)) {
      return res.status(400).json({ error: err.message });
    }

    console.error("changePassword error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
}
