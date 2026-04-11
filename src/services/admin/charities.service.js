import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import { getApplicationCountsByProject } from "../../utils/projectCounts.js";

// charity.service.js
export async function getCharitiesService({
  search,
  status,
  category,
  city,
  skip = 0,
  take = 8,
} = {}) {
  const filters = [];
  const values = [];

  // Base condition
  filters.push(`u."isActive" = true`);

  // Status
  if (status === "verified") {
    filters.push(`c."isVerified" = true`);
  } else if (status === "unverified") {
    filters.push(`c."isVerified" = false`);
  }

  // Category
  if (category && category !== "all") {
    values.push(category);
    filters.push(`c."category" = $${values.length}::"Category"`);
  }

  // City
  if (city && city !== "all") {
    values.push(city);
    filters.push(`c."city" = $${values.length}`);
  }

  let searchQuery = "";
  if (search) {
    values.push(search);
    searchQuery = `
      AND u.search_vector @@ plainto_tsquery('simple', $${values.length}::text)
    `;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const query = `
    SELECT
      c.id,
      c.name,
      c.description,
      c."logoUrl",
      c."websiteUrl",
      c.phone,
      c.address,
      c.city,
      c.category,
      c."isVerified",
      c."userId",
      c."createdAt",
      u.id as "userId",
      u.email as "email",
      u."isActive",
      ${
        search
          ? `ts_rank(u.search_vector, plainto_tsquery('simple', $${values.length})) as rank`
          : `0 as rank`
      }
    FROM "CharityAccount" c
    JOIN "User" u ON c."userId" = u.id
    ${whereClause}
    ${search ? searchQuery : ""}
    ORDER BY rank DESC, c.id DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM "CharityAccount" c
    JOIN "User" u ON c."userId" = u.id
    ${whereClause}
    ${search ? searchQuery : ""}
  `;

  const [charities, totalResult] = await prisma.$transaction([
    prisma.$queryRawUnsafe(query, ...values),
    prisma.$queryRawUnsafe(countQuery, ...values),
  ]);

  return {
    charities,
    total: Number(totalResult[0].count),
  };
}

export async function getCharityService(userId) {
  const charity = await prisma.charityAccount.findUnique({
    where: { userId: Number(userId) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      charityProjects: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!charity) {
    throw new Error("Charity not found.");
  }

  const countMap = await getApplicationCountsByProject(
    charity.charityProjects.map((p) => p.id)
  );

  charity.charityProjects = charity.charityProjects.map((p) => ({
    ...p,
    _count: { applications: countMap[p.id] ?? 0 },
  }));

  return charity;
}

export async function createCharitiesService(data) {
  return await prisma.$transaction(async (tx) => {
    const userExist = await tx.user.findUnique({
      where: { email: data.email },
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
        role: "CHARITY",
        isActive: true,
      },
    });

    const charity = await tx.charityAccount.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        websiteUrl: data.websiteUrl || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        category: data.category || null,
        userId: user.id,
      },
    });

    return { user, charity };
  });
}

export async function updateCharityService(id, data) {
  const allowedFields = [
    "name",
    "email",
    "isActive",
    "isVerified",
    "description",
    "logoUrl",
    "phone",
    "address",
    "websiteUrl",
    "city",
    "category",
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

  // Split updates between User & CharityAccount
  const userData = {};
  const charityData = {};

  if (updateData.name)                          userData.name        = updateData.name;
  if (updateData.email)                         userData.email       = updateData.email;
  if (typeof updateData.isActive === "boolean") userData.isActive    = updateData.isActive;

  if (updateData.description !== undefined)     charityData.description = updateData.description;
  if (updateData.logoUrl     !== undefined)     charityData.logoUrl     = updateData.logoUrl;
  if (updateData.phone       !== undefined)     charityData.phone       = updateData.phone;
  if (updateData.address     !== undefined)     charityData.address     = updateData.address;
  if (updateData.websiteUrl  !== undefined)     charityData.websiteUrl  = updateData.websiteUrl;
  if (updateData.city        !== undefined)     charityData.city        = updateData.city;
  if (updateData.category    !== undefined)     charityData.category    = updateData.category;
  if (typeof updateData.isVerified === "boolean") charityData.isVerified = updateData.isVerified;

  return await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: Number(id) },
        data: userData,
      });
    }

    if (Object.keys(charityData).length > 0) {
      await tx.charityAccount.update({
        where: { userId: Number(id) },
        data: charityData,
      });
    }

    return tx.charityAccount.findUnique({
      where: { userId: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });
  });
}

export async function deleteCharityService(id) {
  const userId = Number(id);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        id: userId,
        role: "CHARITY",
        isActive: true,
      },
    });

    if (!user) {
      throw new Error("Charity not found or already disabled.");
    }

    await tx.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return {
      message: "Charity disabled successfully",
      userId,
    };
  });
}