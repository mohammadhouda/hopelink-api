import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { matchScoreQueue } from "../../jobs/matchScoreQueue.js";

async function enqueueVolunteerScore(userId) {
  console.log(`[MatchScore] enqueueing score:volunteer for userId=${userId}`);
  try {
    const job = await matchScoreQueue.add(
      "score:volunteer",
      { volunteerId: userId },
    );
    console.log(`[MatchScore] job enqueued — jobId=${job?.id}`);
    console.log("[MatchScore] job timestamp:", job.timestamp);
  } catch (err) {
    console.error(`[MatchScore] failed to enqueue score:volunteer for userId=${userId}:`, err.message);
  }
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      baseProfile: true,
      volunteerProfile: {
        include: {
          skills: true,
          preferences: true,
        },
      },
      _count: {
        select: {
          opportunityApplications: true,
          certificates: true,
          ratingsReceived: true,
        },
      },
    },
  });

  if (!user) throw { status: 404, message: "User not found" };
  return user;
}

export async function getRatingsReceived(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const where = { volunteerId: userId };

  const [ratings, total] = await Promise.all([
    prisma.volunteerRating.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        charity: {
          select: {
            id: true,
            name: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.volunteerRating.count({ where }),
  ]);

  return { ratings, total, page, limit };
}

export async function updateProfile(userId, data) {
  const { name, phone, city, country, bio, avatarUrl, isAvailable, availabilityDays, experience } = data;

  await prisma.$transaction(async (tx) => {
    if (name) {
      await tx.user.update({ where: { id: userId }, data: { name } });
    }

    await tx.baseProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      update: {
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    if (isAvailable !== undefined || availabilityDays !== undefined || experience !== undefined) {
      await tx.volunteerProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...(isAvailable !== undefined && { isAvailable }),
          ...(availabilityDays !== undefined && { availabilityDays }),
          ...(experience !== undefined && { experience }),
        },
        update: {
          ...(isAvailable !== undefined && { isAvailable }),
          ...(availabilityDays !== undefined && { availabilityDays }),
          ...(experience !== undefined && { experience }),
        },
      });
    }
  });

  enqueueVolunteerScore(userId);
  return getProfile(userId);
}

export async function updateSkills(userId, skills) {
  const profile = await prisma.volunteerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  await prisma.volunteerSkill.deleteMany({ where: { volunteerId: profile.id } });

  if (skills.length > 0) {
    await prisma.volunteerSkill.createMany({
      data: skills.map((skill) => ({ volunteerId: profile.id, skill })),
    });
  }

  enqueueVolunteerScore(userId);
  return prisma.volunteerSkill.findMany({ where: { volunteerId: profile.id } });
}

export async function updatePreferences(userId, preferences) {
  const profile = await prisma.volunteerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  await prisma.volunteerPreference.deleteMany({ where: { volunteerId: profile.id } });

  if (preferences.length > 0) {
    await prisma.volunteerPreference.createMany({
      data: preferences.map((p) => ({ volunteerId: profile.id, type: p.type, value: p.value })),
    });
  }

  enqueueVolunteerScore(userId);
  return prisma.volunteerPreference.findMany({ where: { volunteerId: profile.id } });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw { status: 400, message: "Current password is incorrect" };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed, passwordChangedAt: new Date() } });
}
