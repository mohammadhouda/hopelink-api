import prisma from "../../config/prisma.js";

export async function getAnalytics(charityId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProjects,
    activeProjects,
    totalOpportunities,
    openOpportunities,
    endedOpportunities,
    totalApplications,
    pendingApplications,
    approvedApplications,
    declinedApplications,
    totalCertificates,
    avgRating,
    recentApplications,
    opportunityBreakdown,
  ] = await Promise.all([
    prisma.charityProject.count({ where: { charityId } }),
    prisma.charityProject.count({ where: { charityId, status: "ACTIVE" } }),

    prisma.volunteeringOpportunity.count({ where: { charityId } }),
    prisma.volunteeringOpportunity.count({ where: { charityId, status: "OPEN" } }),
    prisma.volunteeringOpportunity.count({ where: { charityId, status: "ENDED" } }),

    prisma.opportunityApplication.count({ where: { opportunity: { charityId } } }),
    prisma.opportunityApplication.count({ where: { opportunity: { charityId }, status: "PENDING" } }),
    prisma.opportunityApplication.count({ where: { opportunity: { charityId }, status: "APPROVED" } }),
    prisma.opportunityApplication.count({ where: { opportunity: { charityId }, status: "DECLINED" } }),

    prisma.certificate.count({ where: { charityId } }),

    prisma.volunteerRating.aggregate({
      where: { charityId },
      _avg: { rating: true },
      _count: { rating: true },
    }),

    // Applications in last 30 days
    prisma.opportunityApplication.count({
      where: { opportunity: { charityId }, createdAt: { gte: thirtyDaysAgo } },
    }),

    // Per-opportunity breakdown
    prisma.volunteeringOpportunity.findMany({
      where: { charityId },
      select: {
        id: true,
        title: true,
        status: true,
        maxSlots: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            applications: true,
            ratings: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    projects: {
      total: totalProjects,
      active: activeProjects,
      paused: totalProjects - activeProjects,
    },
    opportunities: {
      total: totalOpportunities,
      open: openOpportunities,
      ended: endedOpportunities,
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      declined: declinedApplications,
      last30Days: recentApplications,
    },
    volunteers: {
      total: approvedApplications,
      averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(2)) : null,
      totalRatings: avgRating._count.rating,
    },
    certificates: {
      issued: totalCertificates,
    },
    recentOpportunities: opportunityBreakdown,
  };
}
