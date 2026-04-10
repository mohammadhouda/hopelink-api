import prisma from "../../config/prisma.js";

export async function getMyRooms(userId) {
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          opportunity: {
            include: {
              charity: { select: { id: true, name: true, logoUrl: true } },
            },
          },
          _count: { select: { members: true, messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.room,
    myRole: m.role,
    joinedAt: m.joinedAt,
    lastMessage: m.room.messages[0] || null,
  }));
}

export async function getRoom(userId, opportunityId) {
  const membership = await prisma.roomMember.findFirst({
    where: { userId, room: { opportunityId } },
  });
  if (!membership) throw { status: 403, message: "You are not a member of this room" };

  const room = await prisma.volunteerRoom.findUnique({
    where: { opportunityId },
    include: {
      opportunity: {
        include: {
          charity: { select: { id: true, name: true, logoUrl: true } },
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              baseProfile: { select: { avatarUrl: true } },
            },
          },
        },
      },
      _count: { select: { members: true, messages: true } },
    },
  });

  if (!room) throw { status: 404, message: "Room not found" };
  return { ...room, myRole: membership.role };
}

export async function getRoomMessages(userId, opportunityId, { page = 1, limit = 50 } = {}) {
  const membership = await prisma.roomMember.findFirst({
    where: { userId, room: { opportunityId } },
  });
  if (!membership) throw { status: 403, message: "You are not a member of this room" };

  const room = await prisma.volunteerRoom.findUnique({ where: { opportunityId } });
  if (!room) throw { status: 404, message: "Room not found" };

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    prisma.roomMessage.findMany({
      where: { roomId: room.id },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            baseProfile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    prisma.roomMessage.count({ where: { roomId: room.id } }),
  ]);

  return { messages: messages.reverse(), total, page, limit, roomId: room.id };
}
