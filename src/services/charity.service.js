import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export async function getCharitiesService() {
  return prisma.charity.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true
        }
      }
    }
  });
}

export async function createCharitiesService(data) {
  return await prisma.$transaction(async (tx) => {

    const userExist = await tx.user.findUnique({
      where: { email: data.email }
    });

    if (userExist) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'CHARITY',
        isActive: true,
      }
    });

    const charity = await tx.charity.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        websiteUrl: data.websiteUrl || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        category: data.category || null,
        userId: user.id,
        createdByAdminId: data.createdByAdminId || null
      }
    });

    return {
      user,
      charity
    };
  });
}


export async function updateCharityService(id, data) {

  const allowedFields = [
    'name',
    'email',
    'isActive',
    'description',
    'logoUrl',
    'phone',
    'address',
    'websiteUrl',
    'city',
    'category'
  ];

  const updateData = {};

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields to update.");
  }

  // Split updates between User & Charity
  const userData = {};
  const charityData = {};

  if (updateData.name) userData.name = updateData.name;
  if (updateData.email) userData.email = updateData.email;
  if (typeof updateData.isActive === 'boolean') userData.isActive = updateData.isActive;

  if (updateData.description !== undefined) charityData.description = updateData.description;
  if (updateData.logoUrl !== undefined) charityData.logoUrl = updateData.logoUrl;
  if (updateData.phone !== undefined) charityData.phone = updateData.phone;
  if (updateData.address !== undefined) charityData.address = updateData.address;
  if (updateData.websiteUrl !== undefined) charityData.websiteUrl = updateData.websiteUrl;
  if (updateData.city !== undefined) charityData.city = updateData.city;
  if (updateData.category !== undefined) charityData.category = updateData.category;

  return await prisma.$transaction(async (tx) => {

    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: Number(id) },
        data: userData
      });
    }

    if (Object.keys(charityData).length > 0) {
      await tx.charity.update({
        where: { userId: Number(id) },
        data: charityData
      });
    }

    return tx.charity.findUnique({
      where: { userId: Number(id) },
      include: { user: true }
    });
  });
}

export async function deleteCharityService(id) {
  const userId = Number(id);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        id: userId,
        role: 'CHARITY',
        isActive: true
      }
    });

    if (!user) {
      throw new Error("Charity not found or already disabled.");
    }

    await tx.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    return {
      message: "Charity disabled successfully",
      userId
    };
  });
}


