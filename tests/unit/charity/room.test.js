import { describe, it, expect, jest } from "@jest/globals";
import { prismaMock } from "../../helpers/db.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const {
  getRoomsByCharity,
  getRoomByOpportunity,
  getRoomMessages,
  closeRoom,
  getMyRooms,
} = await import("../../../src/services/charity/room.service.js");

const CHARITY_ID    = 10;
const OPP_ID        = 5;
const OPPORTUNITY   = { id: OPP_ID, charityId: CHARITY_ID, title: "Clean-up", status: "OPEN", endDate: new Date() };
const ROOM          = { id: "room-1", opportunityId: OPP_ID, status: "OPEN", createdAt: new Date(), closedAt: null };

// getRoomsByCharity() 

describe("getRoomsByCharity()", () => {
  it("returns all rooms for the charity", async () => {
    const rooms = [
      {
        ...ROOM,
        opportunity: { id: OPP_ID, title: "Clean-up", status: "OPEN", endDate: new Date() },
        members: [{ id: "m-1" }],
        _count: { members: 1, messages: 3 },
      },
    ];
    prismaMock.volunteerRoom.findMany.mockResolvedValueOnce(rooms);

    const result = await getRoomsByCharity(CHARITY_ID);

    expect(result).toEqual(rooms);
    expect(prismaMock.volunteerRoom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { opportunity: { charityId: CHARITY_ID } },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("returns an empty array when the charity has no rooms", async () => {
    prismaMock.volunteerRoom.findMany.mockResolvedValueOnce([]);

    const result = await getRoomsByCharity(CHARITY_ID);

    expect(result).toEqual([]);
  });
});

// getRoomByOpportunity()

describe("getRoomByOpportunity()", () => {
  it("returns the room with members when found", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    const roomWithMembers = {
      ...ROOM,
      members: [
        {
          user: { id: 20, name: "John", email: "j@j.com", baseProfile: { avatarUrl: null } },
        },
      ],
      opportunity: OPPORTUNITY,
    };
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(roomWithMembers);

    const result = await getRoomByOpportunity(CHARITY_ID, OPP_ID);

    expect(result).toEqual(roomWithMembers);
  });

  it("throws 404 when the opportunity does not belong to the charity", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(null);

    await expect(getRoomByOpportunity(CHARITY_ID, OPP_ID)).rejects.toMatchObject({
      status: 404,
      message: "Opportunity not found",
    });
    expect(prismaMock.volunteerRoom.findUnique).not.toHaveBeenCalled();
  });

  it("throws 404 when no room exists yet for the opportunity", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(null);

    await expect(getRoomByOpportunity(CHARITY_ID, OPP_ID)).rejects.toMatchObject({
      status: 404,
      message: expect.stringMatching(/no volunteers/i),
    });
  });
});

// getRoomMessages()

describe("getRoomMessages()", () => {
  it("returns paginated messages for an existing room", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(ROOM);
    const msgs = [
      {
        id: "msg-1",
        roomId: "room-1",
        content: "Hello",
        createdAt: new Date(),
        sender: { id: 20, name: "John", baseProfile: { avatarUrl: null } },
      },
    ];
    prismaMock.roomMessage.findMany.mockResolvedValueOnce(msgs);
    prismaMock.roomMessage.count.mockResolvedValueOnce(1);

    const result = await getRoomMessages(CHARITY_ID, OPP_ID, { skip: 0, take: 10, page: 1, limit: 10 });

    expect(result.messages).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.roomId).toBe("room-1");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("reverses the message order so oldest is first", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(ROOM);
    const msg1 = { id: "msg-1", content: "First",  createdAt: new Date(2025, 0, 1), sender: null };
    const msg2 = { id: "msg-2", content: "Second", createdAt: new Date(2025, 0, 2), sender: null };
    // findMany returns newest-first (DESC)
    prismaMock.roomMessage.findMany.mockResolvedValueOnce([msg2, msg1]);
    prismaMock.roomMessage.count.mockResolvedValueOnce(2);

    const result = await getRoomMessages(CHARITY_ID, OPP_ID, { skip: 0, take: 10, page: 1, limit: 10 });

    expect(result.messages[0].id).toBe("msg-1");
    expect(result.messages[1].id).toBe("msg-2");
  });

  it("throws 404 when the opportunity does not belong to the charity", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(null);

    await expect(
      getRoomMessages(CHARITY_ID, OPP_ID, {}),
    ).rejects.toMatchObject({ status: 404, message: "Opportunity not found" });
  });

  it("throws 404 when the room does not exist", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(null);

    await expect(
      getRoomMessages(CHARITY_ID, OPP_ID, {}),
    ).rejects.toMatchObject({ status: 404, message: "Room not found" });
  });
});

// closeRoom()

describe("closeRoom()", () => {
  it("sets status to CLOSED and returns the updated room", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(ROOM);
    const closed = { ...ROOM, status: "CLOSED", closedAt: new Date() };
    prismaMock.volunteerRoom.update.mockResolvedValueOnce(closed);

    const result = await closeRoom(CHARITY_ID, OPP_ID);

    expect(result.status).toBe("CLOSED");
    expect(prismaMock.volunteerRoom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { opportunityId: OPP_ID },
        data: expect.objectContaining({ status: "CLOSED" }),
      }),
    );
  });

  it("throws 404 when the opportunity does not belong to the charity", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(null);

    await expect(closeRoom(CHARITY_ID, OPP_ID)).rejects.toMatchObject({
      status: 404,
      message: "Opportunity not found",
    });
    expect(prismaMock.volunteerRoom.update).not.toHaveBeenCalled();
  });

  it("throws 404 when the room does not exist", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(null);

    await expect(closeRoom(CHARITY_ID, OPP_ID)).rejects.toMatchObject({
      status: 404,
      message: "Room not found",
    });
  });

  it("throws 400 when the room is already closed", async () => {
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(OPPORTUNITY);
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce({ ...ROOM, status: "CLOSED" });

    await expect(closeRoom(CHARITY_ID, OPP_ID)).rejects.toMatchObject({
      status: 400,
      message: "Room already closed",
    });
    expect(prismaMock.volunteerRoom.update).not.toHaveBeenCalled();
  });
});

// getMyRooms()

describe("getMyRooms()", () => {
  it("returns rooms the user is a member of, with myRole and joinedAt", async () => {
    const memberships = [
      {
        role: "MEMBER",
        joinedAt: new Date("2025-01-01"),
        room: {
          id: "room-1",
          opportunityId: OPP_ID,
          status: "OPEN",
          createdAt: new Date(),
          closedAt: null,
          opportunity: { id: OPP_ID, title: "Clean-up", startDate: new Date(), endDate: new Date() },
          _count: { members: 3, messages: 10 },
        },
      },
    ];
    prismaMock.roomMember.findMany.mockResolvedValueOnce(memberships);

    const result = await getMyRooms(20);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "room-1",
      myRole: "MEMBER",
    });
    expect(result[0].joinedAt).toEqual(new Date("2025-01-01"));
    expect(prismaMock.roomMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 20 },
        orderBy: { joinedAt: "desc" },
      }),
    );
  });

  it("returns an empty array when the user has no room memberships", async () => {
    prismaMock.roomMember.findMany.mockResolvedValueOnce([]);

    const result = await getMyRooms(20);

    expect(result).toEqual([]);
  });

  it("spreads all room fields into the result alongside myRole and joinedAt", async () => {
    const room = {
      id: "room-2",
      status: "CLOSED",
      closedAt: new Date(),
      opportunityId: OPP_ID,
      createdAt: new Date(),
      opportunity: { id: OPP_ID, title: "Help", startDate: new Date(), endDate: new Date() },
      _count: { members: 1, messages: 5 },
    };
    prismaMock.roomMember.findMany.mockResolvedValueOnce([
      { role: "ADMIN", joinedAt: new Date("2025-02-01"), room },
    ]);

    const [entry] = await getMyRooms(99);

    expect(entry.id).toBe("room-2");
    expect(entry.status).toBe("CLOSED");
    expect(entry.myRole).toBe("ADMIN");
    expect(entry._count.messages).toBe(5);
  });
});
