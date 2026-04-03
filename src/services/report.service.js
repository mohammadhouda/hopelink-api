import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

// Helper: parse date range from query params
function parseDateRange(from, to) {
  const where = {};
  if (from) where.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    where.lte = end;
  }
  return Object.keys(where).length > 0 ? where : undefined;
}

function buildDateFilters(dateRange) {
  const fragments = [];
  if (dateRange?.gte)
    fragments.push(Prisma.sql`AND "createdAt" >= ${dateRange.gte}`);
  if (dateRange?.lte)
    fragments.push(Prisma.sql`AND "createdAt" <= ${dateRange.lte}`);
  return fragments.length > 0 ? Prisma.join(fragments, " ") : Prisma.empty;
}

export const getRegistrationReport = async (query) => {
  const { from, to, status, category, city } = query;

  const dateRange = parseDateRange(from, to);
  const where = {};
  if (dateRange) where.createdAt = dateRange;
  if (status && status !== "all") where.status = status;
  if (category && category !== "all") where.category = category;
  if (city && city !== "all") where.city = city;

  const dateFilters = buildDateFilters(dateRange);

  const [
    totalRequests,
    byStatus,
    byMonth,
    avgProcessingTime,
    byCategory,
    byCity,
    recentRequests,
  ] = await Promise.all([
    // Total count
    prisma.registrationRequest.count({ where }),

    // Breakdown by status
    prisma.registrationRequest.groupBy({
      by: ["status"],
      _count: { id: true },
      where,
    }),

    // Requests over time (monthly)
    prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as label,
        DATE_TRUNC('month', "createdAt") as date,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'APPROVED')::int as approved,
        COUNT(*) FILTER (WHERE status = 'DECLINED')::int as declined,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending
      FROM "RegistrationRequest"
      WHERE 1=1 ${dateFilters}
      GROUP BY DATE_TRUNC('month', "createdAt"), label
      ORDER BY date ASC
    `,

    // Average processing time (createdAt → reviewedAt) for reviewed requests
    prisma.$queryRaw`
      SELECT 
        ROUND(AVG(EXTRACT(EPOCH FROM ("reviewedAt" - "createdAt")) / 3600)::numeric, 1) as avg_hours
      FROM "RegistrationRequest"
      WHERE "reviewedAt" IS NOT NULL ${dateFilters}
    `,

    // By category
    prisma.registrationRequest.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { ...where, category: { not: null } },
      orderBy: { _count: { id: "desc" } },
    }),

    // By city
    prisma.registrationRequest.groupBy({
      by: ["city"],
      _count: { id: true },
      where: { ...where, city: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    // Recent requests (table data)
    prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        category: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewNote: true,
        reviewer: {
          select: { name: true },
        },
      },
    }),
  ]);

  const statusMap = {};
  byStatus.forEach((s) => {
    statusMap[s.status] = s._count.id;
  });

  return {
    summary: {
      total: totalRequests,
      approved: statusMap.APPROVED || 0,
      declined: statusMap.DECLINED || 0,
      pending: statusMap.PENDING || 0,
      approvalRate:
        totalRequests > 0
          ? Math.round(((statusMap.APPROVED || 0) / totalRequests) * 100)
          : 0,
      avgProcessingHours: avgProcessingTime[0]?.avg_hours ?? null,
    },
    byMonth,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
    })),
    byCity: byCity.map((c) => ({ city: c.city, count: c._count.id })),
    requests: recentRequests,
  };
};

export const getNgoReport = async (query) => {
  const { from, to, category, city, verified } = query;

  const dateRange = parseDateRange(from, to);
  const where = {};
  if (dateRange) where.createdAt = dateRange;
  if (category && category !== "all") where.category = category;
  if (city && city !== "all") where.city = city;
  if (verified === "true") where.isVerified = true;
  if (verified === "false") where.isVerified = false;

  const [
    totalNgos,
    verifiedCount,
    unverifiedCount,
    byCategory,
    byCity,
    ngoList,
  ] = await Promise.all([
    prisma.charityAccount.count({ where }),

    prisma.charityAccount.count({ where: { ...where, isVerified: true } }),

    prisma.charityAccount.count({ where: { ...where, isVerified: false } }),

    prisma.charityAccount.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { ...where, category: { not: null } },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.charityAccount.groupBy({
      by: ["city"],
      _count: { id: true },
      where: { ...where, city: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    prisma.charityAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        city: true,
        category: true,
        isVerified: true,
        createdAt: true,
        user: {
          select: { email: true },
        },
        _count: {
          select: { charityProjects: true },
        },
      },
    }),
  ]);

  return {
    summary: {
      total: totalNgos,
      verified: verifiedCount,
      unverified: unverifiedCount,
      verificationRate:
        totalNgos > 0 ? Math.round((verifiedCount / totalNgos) * 100) : 0,
    },
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
    })),
    byCity: byCity.map((c) => ({ city: c.city, count: c._count.id })),
    ngos: ngoList.map((n) => ({
      id: n.id,
      name: n.name,
      email: n.user?.email ?? "",
      city: n.city,
      category: n.category,
      isVerified: n.isVerified,
      projectCount: n._count.charityProjects,
      createdAt: n.createdAt,
    })),
  };
};

export const getUserReport = async (query) => {
  const { from, to } = query;

  const dateRange = parseDateRange(from, to);
  const where = {};
  if (dateRange) where.createdAt = dateRange;

  const dateFilters = buildDateFilters(dateRange);

  const [
    totalUsers,
    activeCount,
    inactiveCount,
    byRole,
    signupsByMonth,
    userList,
  ] = await Promise.all([
    prisma.user.count({ where }),

    prisma.user.count({ where: { ...where, isActive: true } }),

    prisma.user.count({ where: { ...where, isActive: false } }),

    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
      where,
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as label,
        DATE_TRUNC('month', "createdAt") as date,
        COUNT(*)::int as count
      FROM "User"
      WHERE 1=1 ${dateFilters}
      GROUP BY DATE_TRUNC('month', "createdAt"), label
      ORDER BY date ASC
    `,

    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
  ]);

  return {
    summary: {
      total: totalUsers,
      active: activeCount,
      inactive: inactiveCount,
    },
    byRole: byRole.map((r) => ({ role: r.role, count: r._count.id })),
    signupsByMonth,
    users: userList,
  };
};

export const getProjectReport = async (query) => {
  const { from, to, status, category } = query;

  const dateRange = parseDateRange(from, to);
  const where = {};
  if (dateRange) where.createdAt = dateRange;
  if (status && status !== "all") where.status = status;
  if (category && category !== "all") where.category = category;

  const dateFilters = buildDateFilters(dateRange);

  const [
    totalProjects,
    byStatus,
    byCategory,
    projectsByMonth,
    topCharities,
    projectList,
  ] = await Promise.all([
    prisma.charityProject.count({ where }),

    prisma.charityProject.groupBy({
      by: ["status"],
      _count: { id: true },
      where,
    }),

    prisma.charityProject.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { ...where, category: { not: null } },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as label,
        DATE_TRUNC('month', "createdAt") as date,
        COUNT(*)::int as count
      FROM "CharityProject"
      WHERE 1=1 ${dateFilters}
      GROUP BY DATE_TRUNC('month', "createdAt"), label
      ORDER BY date ASC
    `,

    // Top charities by project count
    prisma.charityAccount.findMany({
      orderBy: { charityProjects: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        name: true,
        _count: { select: { charityProjects: true } },
      },
    }),

    prisma.charityProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
        charity: {
          select: { name: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    }),
  ]);

  const statusMap = {};
  byStatus.forEach((s) => {
    statusMap[s.status] = s._count.id;
  });

  return {
    summary: {
      total: totalProjects,
      active: statusMap.ACTIVE || 0,
      paused: statusMap.PAUSED || 0,
      closed: statusMap.CLOSED || 0,
    },
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
    })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    projectsByMonth,
    topCharities: topCharities.map((c) => ({
      name: c.name,
      projectCount: c._count.charityProjects,
    })),
    projects: projectList.map((p) => ({
      id: p.id,
      title: p.title,
      charity: p.charity.name,
      category: p.category,
      status: p.status,
      applications: p._count.applications,
      createdAt: p.createdAt,
    })),
  };
};

export const getFilterOptions = async () => {
  const [categories, cities] = await Promise.all([
    prisma.charityAccount.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
    prisma.charityAccount.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  return {
    categories: categories.map((c) => c.category),
    cities: cities.map((c) => c.city),
  };
};
