import prisma from "../../config/prisma.js";

async function getProfile(userId) {
  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw { status: 404, message: "Volunteer profile not found. Complete your profile first." };
  return profile;
}

export async function getExperiences(userId) {
  const profile = await getProfile(userId);
  return prisma.volunteerExperience.findMany({
    where: { volunteerId: profile.id },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
  });
}

export async function addExperience(userId, { company, role, startDate, endDate, isCurrent, description }) {
  const profile = await getProfile(userId);
  return prisma.volunteerExperience.create({
    data: {
      volunteerId: profile.id,
      company,
      role,
      startDate: new Date(startDate),
      endDate: isCurrent ? null : (endDate ? new Date(endDate) : null),
      isCurrent: isCurrent ?? false,
      description: description ?? null,
    },
  });
}

export async function updateExperience(userId, experienceId, { company, role, startDate, endDate, isCurrent, description }) {
  const profile = await getProfile(userId);
  const exp = await prisma.volunteerExperience.findFirst({
    where: { id: experienceId, volunteerId: profile.id },
  });
  if (!exp) throw { status: 404, message: "Experience not found" };

  return prisma.volunteerExperience.update({
    where: { id: experienceId },
    data: {
      company,
      role,
      startDate: new Date(startDate),
      endDate: isCurrent ? null : (endDate ? new Date(endDate) : null),
      isCurrent: isCurrent ?? false,
      description: description ?? null,
    },
  });
}

export async function deleteExperience(userId, experienceId) {
  const profile = await getProfile(userId);
  const exp = await prisma.volunteerExperience.findFirst({
    where: { id: experienceId, volunteerId: profile.id },
  });
  if (!exp) throw { status: 404, message: "Experience not found" };
  await prisma.volunteerExperience.delete({ where: { id: experienceId } });
}
