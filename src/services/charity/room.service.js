import prisma from "../../config/prisma.js";

export async function getRoomsByCharity(charityId) {
  const rooms = await prisma.volunteerRoom.findMany({
    where: { opportunity: { charityId } },
    include: {
      opportunity: {
        select: { id: true, title: true, status: true, endDate: true },
      },
      members: { select: { id: true } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rooms;
}

export async function getRoomByOpportunity(charityId, opportunityId) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const room = await prisma.volunteerRoom.findUnique({
    where: { opportunityId },
    include: {
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
      opportunity: {
        select: { id: true, title: true, status: true, endDate: true },
      },
    },
  });

  if (!room)
    throw {
      status: 404,
      message: "Room not found. No volunteers have been approved yet.",
    };
  return room;
}

export async function getRoomMessages(
  charityId,
  opportunityId,
  { skip, take, page, limit } = {},
) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const room = await prisma.volunteerRoom.findUnique({
    where: { opportunityId },
  });
  if (!room) throw { status: 404, message: "Room not found" };

  const [messages, total] = await Promise.all([
    prisma.roomMessage.findMany({
      where: { roomId: room.id },
      skip,
      take,
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

export async function closeRoom(charityId, opportunityId) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const room = await prisma.volunteerRoom.findUnique({
    where: { opportunityId },
  });
  if (!room) throw { status: 404, message: "Room not found" };
  if (room.status === "CLOSED")
    throw { status: 400, message: "Room already closed" };

  return prisma.volunteerRoom.update({
    where: { opportunityId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}

export async function getMyRooms(userId) {
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          opportunity: {
            select: { id: true, title: true, startDate: true, endDate: true },
          },
          _count: { select: { members: true, messages: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.room,
    myRole: m.role,
    joinedAt: m.joinedAt,
  }));
}
