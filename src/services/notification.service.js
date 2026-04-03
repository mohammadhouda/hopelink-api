import prisma from "../config/prisma.js";

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
  type = "info",
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

export async function broadcastToAdmins({
  title,
  message,
  type = "info",
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
