import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export async function getProfileService(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      baseProfile: {
        select: {
          phone: true,
          avatarUrl: true,
          city: true,
          country: true,
          bio: true
        }
      }
    }
  });

  if (!user) throw new Error("User not found");
  return user;
}

export async function updateProfileService(userId, updatedData) {
  // Fields that belong to the User model
  const userData = {};
  if (updatedData.name) userData.name = updatedData.name;
  if (updatedData.email) userData.email = updatedData.email;
  if (updatedData.password) {
    userData.password = await bcrypt.hash(updatedData.password, 10);
    userData.passwordChangedAt = new Date();
  }

  // Fields that belong to the BaseProfile model
  const profileFields = ['phone', 'avatarUrl', 'city', 'country', 'bio'];
  const profileData = {};
  for (const key of profileFields) {
    if (updatedData[key] !== undefined) {
      profileData[key] = updatedData[key];
    }
  }

  const hasUserUpdate = Object.keys(userData).length > 0;
  const hasProfileUpdate = Object.keys(profileData).length > 0;

  if (!hasUserUpdate && !hasProfileUpdate) {
    throw new Error("No valid fields to update.");
  }

  return await prisma.$transaction(async (tx) => {
    if (hasUserUpdate) {
      await tx.user.update({
        where: { id: userId },
        data: userData
      });
    }

    if (hasProfileUpdate) {
      await tx.BaseProfile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            phone: true,
            avatarUrl: true,
            city: true,
            country: true,
            bio: true
          }
        }
      }
    });
  });
}