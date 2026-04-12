import prisma from "../../config/prisma.js";

// ── Opportunity include shape reused in both branches ─────────────────────────
const OPPORTUNITY_INCLUDE = {
  charity: { select: { id: true, name: true, logoUrl: true, category: true, isVerified: true } },
  project: { select: { id: true, title: true } },
  _count:  { select: { applications: { where: { status: "APPROVED" } } } },
};

export async function getOpportunities(userId, { page = 1, limit = 10, status, category, city, search } = {}) {
  const skip = (page - 1) * limit;

  const opportunityWhere = {
    status: status || "OPEN",
    ...(category && { charity: { category } }),
    ...(city     && { location: city }),
    ...(search   && {
      OR: [
        { title:       { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  // Check whether this volunteer has any pre-computed scores
  const scoreCount = await prisma.volunteerMatchScore.count({ where: { volunteerId: userId } });
  const hasScores  = scoreCount > 0;

  let opportunities, total;

  if (hasScores) {
    // ── Scored path: order by pre-computed match score (with fallback to createdAt) ──
    const scoreWhere = { volunteerId: userId, opportunity: opportunityWhere };

    const [scoredRows, scoredTotal] = await Promise.all([
      prisma.volunteerMatchScore.findMany({
        where:   scoreWhere,
        orderBy: [{ score: "desc" }, { opportunity: { createdAt: "desc" } }],
        skip,
        take:    limit,
        include: { opportunity: { include: OPPORTUNITY_INCLUDE } },
      }),
      prisma.volunteerMatchScore.count({ where: scoreWhere }),
    ]);

    opportunities = scoredRows.map((r) => ({
      ...r.opportunity,
      matchScore:         r.score,
      myApplicationStatus: null,
    }));
    total = scoredTotal;

  } else {
    // ── Unscored path: plain pagination ordered by createdAt ─────────────────
    const [rows, count] = await Promise.all([
      prisma.volunteeringOpportunity.findMany({
        where:    opportunityWhere,
        skip,
        take:     limit,
        orderBy:  { createdAt: "desc" },
        include:  OPPORTUNITY_INCLUDE,
      }),
      prisma.volunteeringOpportunity.count({ where: opportunityWhere }),
    ]);

    opportunities = rows.map((o) => ({ ...o, matchScore: null, myApplicationStatus: null }));
    total = count;
  }

  // Attach the user's own application status for each opportunity
  const opportunityIds = opportunities.map((o) => o.id);
  if (opportunityIds.length > 0) {
    const myApplications = await prisma.opportunityApplication.findMany({
      where:  { userId, opportunityId: { in: opportunityIds } },
      select: { opportunityId: true, status: true },
    });
    const appliedMap = Object.fromEntries(myApplications.map((a) => [a.opportunityId, a.status]));
    opportunities.forEach((o) => { o.myApplicationStatus = appliedMap[o.id] ?? null; });
  }

  return { opportunities, total, page, limit, hasScores };
}

export async function getOpportunityById(opportunityId, userId) {
  const opportunity = await prisma.volunteeringOpportunity.findUnique({
    where: { id: opportunityId },
    include: {
      charity: { select: { id: true, name: true, logoUrl: true, category: true, isVerified: true, city: true, description: true } },
      project: { select: { id: true, title: true } },
      _count: { select: { applications: { where: { status: "APPROVED" } } } },
    },
  });

  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const myApplication = await prisma.opportunityApplication.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
    select: { id: true, status: true, createdAt: true, message: true },
  });

  return { ...opportunity, myApplication: myApplication || null };
}
