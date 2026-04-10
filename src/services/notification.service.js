import prisma from "../config/prisma.js";
import notificationEmitter, { NOTIFY_USER, NOTIFY_ADMINS, NOTIFY_CHARITY } from "../events/notificationEmitter.js";

export async function getNotifications(
  userId,
  { limit = 20, offset = 0, unreadOnly = false } = {},
) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, total, unreadCount };
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(userId, notificationId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  link = null,
}) {
  return prisma.notification.create({
    data: { userId, title, message, type, link },
  });
}

export async function deleteNotification(userId, notificationId) {
  return prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

// ── Event-driven listeners ────────────────────────────────────────────────────
notificationEmitter.on(NOTIFY_USER, async ({ userId, title, message, type = "INFO", link = null }) => {
  try { await createNotification({ userId, title, message, type, link }); } catch { /* silent */ }
});

notificationEmitter.on(NOTIFY_ADMINS, async ({ title, message, type = "INFO", link = null }) => {
  try { await broadcastToAdmins({ title, message, type, link }); } catch { /* silent */ }
});

notificationEmitter.on(NOTIFY_CHARITY, async ({ charityId, title, message, type = "INFO", link = null }) => {
  try {
    const charity = await prisma.charityAccount.findUnique({ where: { id: charityId }, select: { userId: true } });
    if (charity) await createNotification({ userId: charity.userId, title, message, type, link });
  } catch { /* silent */ }
});

export async function broadcastToAdmins({
  title,
  message,
  type = "INFO",
  link = null,
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length === 0) return [];

  return prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type,
      link,
    })),
  });
}
