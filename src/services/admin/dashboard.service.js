import prisma from "../../config/prisma.js";

export const getDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const [
    pendingRegistrations,
    pendingVerifications,
    activeUsers,
    activeUsersBeforeThisMonth,
    registrationTrends,
    ngosByCity,
    pendingRegistrationsList,
    pendingVerificationsList,
    activeProjects,
    totalProjects,
    recentRegDecisions,
    recentVerDecisions,
  ] = await Promise.all([
    // Pending counts
    prisma.registrationRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.verificationRequest.count({
      where: { status: "PENDING" },
    }),

    // Active users (current)
    prisma.user.count({
      where: { isActive: true },
    }),

    // Active users created before this month (for growth calc)
    prisma.user.count({
      where: {
        isActive: true,
        createdAt: { lt: startOfMonth },
      },
    }),

    // Registration trends (last 7 months)
    prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        EXTRACT(YEAR FROM "createdAt")::int as year,
        COUNT(*)::int as count
      FROM "RegistrationRequest"
      WHERE "createdAt" >= ${sevenMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt"), month, year
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,

    // NGOs grouped by city
    prisma.charityAccount.groupBy({
      by: ["city"],
      _count: { id: true },
      where: { city: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    // Pending registration requests (for actions table)
    prisma.registrationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        category: true,
        createdAt: true,
      },
    }),

    // Pending verification requests (for actions table)
    prisma.verificationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            charityAccount: {
              select: {
                name: true,
                city: true,
                category: true,
              },
            },
          },
        },
      },
    }),

    // Active projects count
    prisma.charityProject.count({
      where: { status: "ACTIVE" },
    }),

    // Total projects (for context)
    prisma.charityProject.count(),

    // Recent registration decisions (approved/declined)
    prisma.registrationRequest.findMany({
      where: { status: { in: ["APPROVED", "DECLINED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        category: true,
        reviewedAt: true,
        reviewNote: true,
      },
    }),

    // Recent verification decisions (approved/declined)
    prisma.verificationRequest.findMany({
      where: { status: { in: ["APPROVED", "DECLINED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        reviewNote: true,
        user: {
          select: {
            name: true,
            email: true,
            charityAccount: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ]);

  // Shape pending actions
  const pendingActions = [
    ...pendingRegistrationsList.map((r) => ({
      id: r.id,
      org: r.name,
      email: r.email,
      type: "Registration",
      category: r.category || null,
      city: r.city || null,
      submitted: r.createdAt,
    })),
    ...pendingVerificationsList.map((v) => ({
      id: v.id,
      org: v.user?.charityAccount?.name || v.user?.name || "Unknown",
      email: v.user?.email || "",
      type: "Verification",
      category: v.user?.charityAccount?.category || null,
      city: v.user?.charityAccount?.city || null,
      submitted: v.createdAt,
    })),
  ].sort((a, b) => new Date(b.submitted) - new Date(a.submitted));

  // Shape recent decisions — merge both types, sort by reviewedAt, take 5
  const recentDecisions = [
    ...recentRegDecisions.map((r) => ({
      id: r.id,
      org: r.name,
      email: r.email,
      type: "Registration",
      status: r.status,
      reviewedAt: r.reviewedAt,
      reviewNote: r.reviewNote,
    })),
    ...recentVerDecisions.map((v) => ({
      id: v.id,
      org: v.user?.charityAccount?.name || v.user?.name || "Unknown",
      email: v.user?.email || "",
      type: "Verification",
      status: v.status,
      reviewedAt: v.reviewedAt,
      reviewNote: v.reviewNote,
    })),
  ]
    .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
    .slice(0, 5);

  return {
    metrics: {
      pendingRequests: {
        total: pendingRegistrations + pendingVerifications,
        registration: pendingRegistrations,
        verification: pendingVerifications,
      },
      activeUsers: {
        total: activeUsers,
        growth: activeUsers - activeUsersBeforeThisMonth,
      },
      activeProjects: {
        active: activeProjects,
        total: totalProjects,
      },
    },
    registrationTrends,
    ngosByCity: ngosByCity.map((c) => ({
      city: c.city,
      count: c._count.id,
    })),
    pendingActions,
    recentDecisions,
  };
};