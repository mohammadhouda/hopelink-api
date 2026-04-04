import bcrypt from "bcrypt";
import * as auditService from "../audit.service.js";
import prisma from "../../config/prisma.js";

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      baseProfile: {
        select: {
          phone: true,
          avatarUrl: true,
          city: true,
          country: true,
          bio: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    phone: user.baseProfile?.phone || "",
    avatarUrl: user.baseProfile?.avatarUrl || "",
    city: user.baseProfile?.city || "",
    country: user.baseProfile?.country || "",
    bio: user.baseProfile?.bio || "",
  };
}

export async function updateProfile(userId, data, { ip }) {
  const { name, phone, city, country, bio } = data;

  // Update user name
  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  // Upsert base profile
  await prisma.baseProfile.upsert({
    where: { userId },
    update: { phone, city, country, bio },
    create: { userId, phone, city, country, bio },
  });

  await auditService.log({
    userId,
    action: "updated",
    target: name,
    targetType: "user",
    details: "Profile updated",
    ipAddress: ip,
  });

  return getProfile(userId);
}

export async function getAvatarUrl(userId) {
  const profile = await prisma.baseProfile.findUnique({
    where: { userId },
    select: { avatarUrl: true },
  });

  return profile?.avatarUrl || null;
}

export async function updateAvatar(userId, avatarUrl) {
  await prisma.baseProfile.upsert({
    where: { userId },
    update: { avatarUrl },
    create: {
      userId,
      avatarUrl,
    },
  });

  return getProfile(userId);
}

export async function changePassword(
  userId,
  { currentPassword, newPassword },
  { ip },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, password: true },
  });

  if (!user) throw new Error("User not found");

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect");

  // Validate new password
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    },
  });

  await auditService.log({
    userId,
    action: "updated",
    target: user.name,
    targetType: "user",
    details: "Password changed",
    ipAddress: ip,
  });

  return { message: "Password changed successfully" };
}
