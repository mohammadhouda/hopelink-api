import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";

export async function getUsersService({
  search,
  status,
  role,
  city,
  skip = 0,
  take = 10,
} = {}) {
  const filters = [];
  const values = [];

  // Exclude admins and charity accounts
  if (role && role !== "all") {
    values.push(role);
    filters.push(`u."role" = $${values.length}::"Role"`);
  } else {
    filters.push(`u."role" IN ('USER', 'VOLUNTEER')`);
  }

  // Status filter
  if (status === "active")    filters.push(`u."isActive" = true`);
  if (status === "suspended") filters.push(`u."isActive" = false`);

  // City filter
  if (city && city !== "all") {
    values.push(city);
    filters.push(`bp."city" = $${values.length}`);
  }

  // tsvector search
  let searchQuery = "";
  if (search) {
    values.push(search);
    searchQuery = `AND u.search_vector @@ plainto_tsquery('simple', $${values.length}::text)`;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u."isActive",
      u."createdAt",
      u."lastLoginAt",
      bp.phone,
      bp."avatarUrl",
      bp.city,
      bp.country,
      bp.bio,
      ${search
        ? `ts_rank(u.search_vector, plainto_tsquery('simple', $${values.length})) as rank`
        : `0 as rank`}
    FROM "User" u
    LEFT JOIN "BaseProfile" bp ON bp."userId" = u.id
    ${whereClause}
    ${search ? searchQuery : ""}
    ORDER BY rank DESC, u."createdAt" DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM "User" u
    LEFT JOIN "BaseProfile" bp ON bp."userId" = u.id
    ${whereClause}
    ${search ? searchQuery : ""}
  `;

  const [rows, totalResult] = await prisma.$transaction([
    prisma.$queryRawUnsafe(query, ...values),
    prisma.$queryRawUnsafe(countQuery, ...values),
  ]);

  // Shape raw rows back into the nested structure the frontend expects
  const users = rows.map((r) => ({
    id:          r.id,
    name:        r.name,
    email:       r.email,
    role:        r.role,
    isActive:    r.isActive,
    createdAt:   r.createdAt,
    lastLoginAt: r.lastLoginAt,
    baseProfile: {
      phone:     r.phone,
      avatarUrl: r.avatarUrl,
      city:      r.city,
      country:   r.country,
      bio:       r.bio,
    },
  }));

  return { users, total: Number(totalResult[0].count) };
}

// ── Get single user by id
export async function getUserService(userId) {
  const user = await prisma.user.findFirst({
    where: {
      id: Number(userId),
      role: { in: ["USER", "VOLUNTEER"] },
    },
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
      volunteerProfile: {
        select: {
          isAvailable: true,
          availabilityDays: true,
          experience: true,
          isVerified: true,
          skills: { select: { skill: true } },
          preferences: { select: { type: true, value: true } },
        },
      },
      opportunityApplications: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          message: true,
          createdAt: true,
          opportunity: {
            select: {
              id: true,
              title: true,
              status: true,
              charity: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!user) throw new Error("User not found.");
  return user;
}

// ── Get distinct cities for filter dropdown
export async function getUserCitiesService() {
  const profiles = await prisma.baseProfile.findMany({
    where: {
      city: { not: null },
      user: { role: { in: ["USER", "VOLUNTEER"] } },
    },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return profiles.map((p) => p.city).filter(Boolean);
}

// ── Create user
export async function createUserService({
  name,
  email,
  password,
  role = "USER",
  phone,
  avatarUrl,
  city,
  country,
  bio,
}) {
  return prisma.$transaction(async (tx) => {
    const userExist = await tx.user.findUnique({ where: { email } });
    if (userExist) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await tx.user.create({
      data: { name, email, password: hashedPassword, role, isActive: true },
    });

    await tx.baseProfile.create({
      data: {
        userId:    user.id,
        phone:     phone     || null,
        avatarUrl: avatarUrl || null,
        city:      city      || null,
        country:   country   || null,
        bio:       bio       || null,
      },
    });

    if (role === "VOLUNTEER") {
      await tx.volunteerProfile.create({
        data: { userId: user.id },
      });
    }

    return user;
  });
}

// ── Update user
export async function updateUserService(id, updateData) {
  const userId = Number(id);

  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["USER", "VOLUNTEER"] } },
  });
  if (!user) throw new Error("User not found or inactive.");

  if (updateData.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email: updateData.email } });
    if (emailOwner && emailOwner.id !== userId) throw new Error("Email already in use.");
  }

  const userFields    = ["name", "email", "isActive"];
  const profileFields = ["phone", "avatarUrl", "city", "country", "bio"];
  const userData      = {};
  const profileData   = {};

  for (const f of userFields)    if (updateData[f] !== undefined) userData[f]    = updateData[f];
  for (const f of profileFields) if (updateData[f] !== undefined) profileData[f] = updateData[f];

  if (!Object.keys(userData).length && !Object.keys(profileData).length) {
    throw new Error("No valid fields provided for update.");
  }

  return prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) {
      await tx.user.update({ where: { id: userId }, data: userData });
    }

    if (Object.keys(profileData).length) {
      await tx.baseProfile.upsert({
        where:  { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true, lastLoginAt: true,
        baseProfile: {
          select: { phone: true, avatarUrl: true, city: true, country: true, bio: true },
        },
      },
    });
  });
}

// ── Delete user (soft delete)
export async function deleteUserService(userId) {
  return prisma.$transaction(async (tx) => {
    const id = Number(userId);
    const user = await tx.user.findFirst({
      where: { id, role: { in: ["USER", "VOLUNTEER"] }, isActive: true },
    });

    if (!user) throw new Error("User not found or already disabled.");

    await tx.user.update({ where: { id }, data: { isActive: false } });
    return { id: userId };
  });
}