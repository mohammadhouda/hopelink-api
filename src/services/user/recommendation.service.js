import prisma from "../../config/prisma.js";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function score(opportunity, skills, availabilityDays, preferences) {
  let points = 0;
  const text = `${opportunity.title} ${opportunity.description}`.toLowerCase();

  // +2 per skill that appears in title/description
  for (const skill of skills) {
    if (text.includes(skill.toLowerCase())) points += 2;
  }

  // +3 if opportunity's start-day is in the volunteer's availability
  if (opportunity.startDate && availabilityDays.length > 0) {
    const dayName = DAYS[new Date(opportunity.startDate).getDay()];
    if (availabilityDays.includes(dayName)) points += 3;
  }

  // +3 per category preference match, +2 per city preference match
  for (const pref of preferences) {
    if (pref.type === "CATEGORY" && opportunity.charity?.category === pref.value) points += 3;
    if (pref.type === "CITY" && opportunity.location?.toLowerCase().includes(pref.value.toLowerCase())) points += 2;
  }

  return points;
}

export async function getRecommendations(userId, { limit = 10 } = {}) {
  // Load volunteer profile
  const volunteerProfile = await prisma.volunteerProfile.findUnique({
    where: { userId },
    include: { skills: true, preferences: true },
  });

  const skills         = volunteerProfile?.skills.map((s) => s.skill) ?? [];
  const availabilityDays = volunteerProfile?.availabilityDays ?? [];
  const preferences    = volunteerProfile?.preferences ?? [];

  // IDs of opportunities already applied to
  const applied = await prisma.opportunityApplication.findMany({
    where: { userId },
    select: { opportunityId: true },
  });
  const appliedIds = new Set(applied.map((a) => a.opportunityId));

  // Fetch all OPEN opportunities not yet applied to
  const opportunities = await prisma.volunteeringOpportunity.findMany({
    where: {
      status: "OPEN",
      id: { notIn: appliedIds.size > 0 ? [...appliedIds] : undefined },
    },
    include: {
      charity: { select: { id: true, name: true, logoUrl: true, category: true, city: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { startDate: "asc" },
  });

  // Score and sort
  const scored = opportunities
    .map((opp) => ({ ...opp, score: score(opp, skills, availabilityDays, preferences) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    recommendations: scored,
    meta: { skills, availabilityDays, preferences },
  };
}
