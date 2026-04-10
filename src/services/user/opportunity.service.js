import prisma from "../../config/prisma.js";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function scoreOpportunity(opp, volunteerSkills, volunteerDays, preferences) {
  let score = 0;

  // +2 per required skill that matches a volunteer skill
  for (const skill of opp.requiredSkills) {
    if (volunteerSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) score += 2;
  }

  // +1 per volunteer skill found in title/description (fuzzy fallback when no requiredSkills set)
  if (opp.requiredSkills.length === 0) {
    const text = `${opp.title} ${opp.description}`.toLowerCase();
    for (const skill of volunteerSkills) {
      if (text.includes(skill.toLowerCase())) score += 1;
    }
  }

  // +3 per overlapping availability day
  for (const day of opp.availabilityDays) {
    if (volunteerDays.includes(day)) score += 3;
  }

  // +3 start-day fallback when opportunity has no availabilityDays set
  if (opp.availabilityDays.length === 0 && opp.startDate && volunteerDays.length > 0) {
    const dayName = DAYS[new Date(opp.startDate).getDay()];
    if (volunteerDays.includes(dayName)) score += 1;
  }

  // +3 category preference match, +2 city preference match
  for (const pref of preferences) {
    if (pref.type === "CATEGORY" && opp.charity?.category === pref.value) score += 3;
    if (pref.type === "CITY" && opp.location?.toLowerCase().includes(pref.value.toLowerCase())) score += 2;
  }

  return score;
}

export async function getOpportunities(userId, { page = 1, limit = 10, status, category, city, search } = {}) {
  const skip = (page - 1) * limit;

  const where = {
    status: status || "OPEN",
    ...(category && { charity: { category } }),
    ...(city && { location: { contains: city, mode: "insensitive" } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  // Load volunteer profile for scoring
  const volunteerProfile = await prisma.volunteerProfile.findUnique({
    where: { userId },
    include: { skills: true, preferences: true },
  });
  const volunteerSkills = volunteerProfile?.skills.map((s) => s.skill) ?? [];
  const volunteerDays   = volunteerProfile?.availabilityDays ?? [];
  const preferences     = volunteerProfile?.preferences ?? [];
  const hasProfile      = volunteerSkills.length > 0 || volunteerDays.length > 0 || preferences.length > 0;

  const [opportunities, total] = await Promise.all([
    prisma.volunteeringOpportunity.findMany({
      where,
      skip: hasProfile ? 0 : skip,   // fetch all for scoring when profile exists, paginate otherwise
      take:  hasProfile ? undefined : limit,
      orderBy: { createdAt: "desc" },
      include: {
        charity: { select: { id: true, name: true, logoUrl: true, category: true, isVerified: true } },
        project: { select: { id: true, title: true } },
        _count: { select: { opportunities: true } },
      },
    }),
    prisma.volunteeringOpportunity.count({ where }),
  ]);

  // Attach application status
  const opportunityIds = opportunities.map((o) => o.id);
  const myApplications = await prisma.opportunityApplication.findMany({
    where: { userId, opportunityId: { in: opportunityIds } },
    select: { opportunityId: true, status: true },
  });
  const appliedMap = Object.fromEntries(myApplications.map((a) => [a.opportunityId, a.status]));

  // Score + sort when volunteer has a profile
  let result = opportunities.map((o) => ({
    ...o,
    myApplicationStatus: appliedMap[o.id] || null,
    matchScore: hasProfile ? scoreOpportunity(o, volunteerSkills, volunteerDays, preferences) : null,
  }));

  if (hasProfile) {
    result.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0) || b.createdAt - a.createdAt);
    result = result.slice(skip, skip + limit);
  }

  return { opportunities: result, total, page, limit, hasProfile };
}

export async function getOpportunityById(opportunityId, userId) {
  const opportunity = await prisma.volunteeringOpportunity.findUnique({
    where: { id: opportunityId },
    include: {
      charity: { select: { id: true, name: true, logoUrl: true, category: true, isVerified: true, city: true, description: true } },
      project: { select: { id: true, title: true } },
      _count: { select: { opportunities: true } },
    },
  });

  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const myApplication = await prisma.opportunityApplication.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
    select: { id: true, status: true, createdAt: true, message: true },
  });

  return { ...opportunity, myApplication: myApplication || null };
}
