import prisma from "../../config/prisma.js";

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

  const [opportunities, total] = await Promise.all([
    prisma.volunteeringOpportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        charity: { select: { id: true, name: true, logoUrl: true, category: true, isVerified: true } },
        project: { select: { id: true, title: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.volunteeringOpportunity.count({ where }),
  ]);

  // Attach whether the current user has applied
  const opportunityIds = opportunities.map((o) => o.id);
  const myApplications = await prisma.opportunityApplication.findMany({
    where: { userId, opportunityId: { in: opportunityIds } },
    select: { opportunityId: true, status: true },
  });
  const appliedMap = Object.fromEntries(myApplications.map((a) => [a.opportunityId, a.status]));

  return {
    opportunities: opportunities.map((o) => ({ ...o, myApplicationStatus: appliedMap[o.id] || null })),
    total,
    page,
    limit,
  };
}

export async function getOpportunityById(opportunityId, userId) {
  const opportunity = await prisma.volunteeringOpportunity.findUnique({
    where: { id: opportunityId },
    include: {
      charity: { select: { id: true, name: true, logoUrl: true, category: true, isVerified: true, city: true, description: true } },
      project: { select: { id: true, title: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const myApplication = await prisma.opportunityApplication.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
    select: { id: true, status: true, createdAt: true, message: true },
  });

  return { ...opportunity, myApplication: myApplication || null };
}
