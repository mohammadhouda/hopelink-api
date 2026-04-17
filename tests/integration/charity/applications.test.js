import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const CHARITY_COOKIE = () => makeAccessCookie(1, "CHARITY");
const CHARITY_ID = 10;

function charityAuth() {
  mockAuthMiddleware({ id: 1, role: "CHARITY" });
  prismaMock.charityAccount.findUnique.mockResolvedValueOnce({ id: CHARITY_ID });
}

function makeApplication(overrides = {}) {
  return {
    id: 1,
    status: "PENDING",
    opportunityId: 5,
    userId: 20,
    createdAt: new Date(),
    opportunity: {
      id: 5,
      title: "Park Clean-up",
      charityId: CHARITY_ID,
      maxSlots: 10,
      startDate: new Date(),
      endDate:   new Date(),
      _count: { applications: 2 },
    },
    user: {
      id: 20,
      name: "Jane Doe",
      email: "jane@example.com",
      baseProfile: null,
      volunteerProfile: null,
    },
    ...overrides,
  };
}

describe("GET /api/charity/applications", () => {
  it("returns 200 with paginated applications", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([makeApplication()]);
    prismaMock.opportunityApplication.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get("/api/charity/applications")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.applications).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("returns 403 when authenticated as USER", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/charity/applications")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/charity/applications/:id/approve", () => {
  it("returns 200 on successful approval", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(makeApplication());
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.opportunityApplication.update.mockResolvedValueOnce({
      ...makeApplication(),
      status: "APPROVED",
    });
    prismaMock.volunteeringOpportunity.update.mockResolvedValue({});
    prismaMock.volunteerRoom.findUnique.mockResolvedValueOnce(null);
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce({ userId: 1 });
    prismaMock.volunteerRoom.create.mockResolvedValueOnce({ id: "room-1" });
    prismaMock.roomMember.create.mockResolvedValue({});

    const res = await request(app)
      .patch("/api/charity/applications/1/approve")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/approved/i);
  });

  it("returns 404 when application is not found", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .patch("/api/charity/applications/999/approve")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(404);
  });

  it("returns 400 when application is not in PENDING status", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(
      makeApplication({ status: "APPROVED" }),
    );

    const res = await request(app)
      .patch("/api/charity/applications/1/approve")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });
});

describe("PATCH /api/charity/applications/:id/decline", () => {
  it("returns 200 on successful decline", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(makeApplication());
    prismaMock.opportunityApplication.update.mockResolvedValueOnce({
      ...makeApplication(),
      status: "DECLINED",
    });

    const res = await request(app)
      .patch("/api/charity/applications/1/decline")
      .set("Cookie", CHARITY_COOKIE())
      .send({ reason: "Not qualified" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/declined/i);
  });
});
