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

function makeApprovedApplication(overrides = {}) {
  return {
    id: 1,
    status: "APPROVED",
    opportunityId: 5,
    userId: 20,
    updatedAt: new Date(),
    user: {
      id: 20,
      name: "John Volunteer",
      email: "john@example.com",
      baseProfile: { avatarUrl: null, phone: null, city: "Riyadh", country: null },
      volunteerProfile: { isVerified: false, isAvailable: true, experience: "beginner" },
    },
    opportunity: {
      id: 5,
      title: "Park Clean-up",
      startDate: new Date(),
      endDate:   new Date(),
    },
    ...overrides,
  };
}

describe("GET /api/charity/volunteers", () => {
  it("returns 200 with paginated volunteers", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([
      makeApprovedApplication(),
    ]);

    const res = await request(app)
      .get("/api/charity/volunteers")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.volunteers).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("returns 200 with an empty list when no volunteers are approved", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/charity/volunteers")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.volunteers).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it("returns 403 when authenticated as USER", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/charity/volunteers")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/charity/volunteers/:id", () => {
  it("returns 200 with volunteer details", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([
      makeApprovedApplication(),
    ]);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 20,
      name: "John Volunteer",
      email: "john@example.com",
      createdAt: new Date(),
      baseProfile: null,
      volunteerProfile: null,
      ratingsReceived: [],
      _count: { certificates: 0 },
    });

    const res = await request(app)
      .get("/api/charity/volunteers/20")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 when volunteer is not found", async () => {
    charityAuth();
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/charity/volunteers/999")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/charity/volunteers/:id", () => {
  it("returns 400 when opportunityId is missing", async () => {
    charityAuth();

    const res = await request(app)
      .delete("/api/charity/volunteers/20")
      .set("Cookie", CHARITY_COOKIE())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/opportunityId is required/i);
  });
});
