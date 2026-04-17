import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const USER_COOKIE = () => makeAccessCookie(1, "USER");

function userAuth() {
  mockAuthMiddleware({ id: 1, role: "USER" });
}

function makeOpportunity(overrides = {}) {
  return {
    id: 1,
    title: "Help at shelter",
    description: "Assist residents",
    status: "OPEN",
    location: "Riyadh",
    maxSlots: 10,
    startDate: new Date(),
    endDate:   new Date(),
    charity: { id: 5, name: "Good Charity", logoUrl: null, category: "HEALTH", isVerified: true },
    project: null,
    _count:  { applications: 2 },
    ...overrides,
  };
}

describe("GET /api/user/opportunities — unscored path", () => {
  it("returns 200 with opportunity list ordered by createdAt", async () => {
    userAuth();
    prismaMock.volunteerMatchScore.count.mockResolvedValueOnce(0);
    prismaMock.volunteeringOpportunity.findMany.mockResolvedValueOnce([makeOpportunity()]);
    prismaMock.volunteeringOpportunity.count.mockResolvedValueOnce(1);
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/user/opportunities")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.opportunities).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("returns 403 when authenticated as CHARITY", async () => {
    mockAuthMiddleware({ id: 2, role: "CHARITY" });

    const res = await request(app)
      .get("/api/user/opportunities")
      .set("Cookie", makeAccessCookie(2, "CHARITY"));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/user/opportunities — scored path", () => {
  it("returns 200 with opportunities ranked by match score", async () => {
    userAuth();
    prismaMock.volunteerMatchScore.count.mockResolvedValueOnce(3);
    prismaMock.volunteerMatchScore.findMany.mockResolvedValueOnce([
      { score: 8, opportunity: makeOpportunity({ id: 1 }) },
      { score: 4, opportunity: makeOpportunity({ id: 2, title: "Second" }) },
    ]);
    prismaMock.volunteerMatchScore.count.mockResolvedValueOnce(2);
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/user/opportunities")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.opportunities).toHaveLength(2);
    expect(res.body.data.opportunities[0].matchScore).toBe(8);
  });
});

describe("GET /api/user/opportunities/:id", () => {
  it("returns 200 with opportunity details", async () => {
    userAuth();
    prismaMock.volunteeringOpportunity.findUnique.mockResolvedValueOnce(makeOpportunity());
    prismaMock.opportunityApplication.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/user/opportunities/1")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it("returns 404 when opportunity is not found", async () => {
    userAuth();
    prismaMock.volunteeringOpportunity.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/user/opportunities/999")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(404);
  });
});
