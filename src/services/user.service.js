import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export async function deleteUserService(userId) {
    return prisma.$transaction(async (tx) => {
        const id = Number(userId);
        const user = await tx.user.findFirst({
            where: {
                id: id,
                role: 'USER',
                isActive: true
            }
        });
        
        if (!user) {
            throw new Error("User not found or already disabled.");
        }
        
        await tx.user.update({
            where: { id: id },
            data: { isActive: false }
        });
        
        return { id: userId };
    });
}

export async function createUserService({
  name,
  email,
  password,
  role = 'USER',
  phone,
  avatarUrl,
  city,
  country,
  bio
}) {
  return prisma.$transaction(async (tx) => {

    const userExist = await tx.user.findUnique({
      where: { email }
    });

    if (userExist) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true
      }
    });

    // Create UserProfile ONLY for normal users
    if (role === 'USER') {
      await tx.userProfile.create({
        data: {
          userId: user.id,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
          city: city || null,
          country: country || null,
          bio: bio || null
        }
      });
    }

    return user;
  });
}


export async function getUsersService() {
  return prisma.user.findMany({
    where: {
      isActive: true,
      role: 'USER'
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    }
  });
}

export async function updateUserService(id, updateData) {
  const userId = Number(id);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true
    }
  });

  if (!user) {
    throw new Error("User not found or inactive.");
  }

  // PREVENT EMAIL COLLISION
  if (updateData.email) {
    const emailOwner = await prisma.user.findUnique({
      where: { email: updateData.email }
    });

    if (emailOwner && emailOwner.id !== userId) {
      throw new Error("Email already in use.");
    }
  }

  // Account-level fields
  const userFields = ['name', 'email', 'isActive'];
  const userData = {};

  // Profile-level fields
  const profileFields = ['phone', 'avatarUrl', 'city', 'country', 'bio'];
  const profileData = {};

  for (const field of userFields) {
    if (updateData[field] !== undefined) {
      userData[field] = updateData[field];
    }
  }

  for (const field of profileFields) {
    if (updateData[field] !== undefined) {
      profileData[field] = updateData[field];
    }
  }

  if (
    Object.keys(userData).length === 0 &&
    Object.keys(profileData).length === 0
  ) {
    throw new Error("No valid fields provided for update.");
  }

  return prisma.$transaction(async (tx) => {

    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userData
      });
    }

    if (Object.keys(profileData).length > 0) {
      await tx.userProfile.upsert({
        where: { userId },
        update: profileData,
        create: {
          userId,
          ...profileData
        }
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      include: { userProfile: true }
    });
  });
}
