import prisma from "../config/prisma.js";

export async function log({
  userId,
  action,
  target,
  targetType,
  details = "",
  ipAddress = null,
}) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, target, targetType, details, ipAddress },
    });
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
}

export async function getEntries({
  userId,
  action,
  page = 1,
  limit = 50,
} = {}) {
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { User: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    entries: entries.map((e) => ({
      id: e.id,
      user: e.User.name,
      userEmail: e.User.email,
      action: e.action,
      target: e.target,
      targetType: e.targetType,
      details: e.details,
      ipAddress: e.ipAddress,
      timestamp: e.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
