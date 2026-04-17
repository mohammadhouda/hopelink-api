import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const CHARITY_COOKIE = () => makeAccessCookie(1, "CHARITY");

// authMiddleware + attachCharity each need a charityAccount.findUnique call
function charityAuth(charityId = 10) {
  mockAuthMiddleware({ id: 1, role: "CHARITY" });
  prismaMock.charityAccount.findUnique.mockResolvedValueOnce({ id: charityId });
}

function makeProfile(overrides = {}) {
  return {
    id: 10,
    name: "Good Charity",
    description: "We help",
    logoUrl: null,
    websiteUrl: null,
    phone: null,
    address: null,
    city: "Riyadh",
    category: "EDUCATION",
    isVerified: false,
    userId: 1,
    user: { id: 1, name: "Charity User", email: "charity@example.com", createdAt: new Date() },
    _count: { charityProjects: 2, opportunities: 3, ratingsGiven: 0, issuedCerts: 0 },
    ...overrides,
  };
}

describe("GET /api/charity/profile", () => {
  it("returns 200 with the charity profile", async () => {
    charityAuth();
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(makeProfile());

    const res = await request(app)
      .get("/api/charity/profile")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: "Good Charity" });
  });

  it("returns 404 when the charity profile does not exist", async () => {
    charityAuth();
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/charity/profile")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/charity/profile");
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as USER", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/charity/profile")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/charity/profile", () => {
  it("returns 200 with updated profile", async () => {
    charityAuth();
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(makeProfile());
    prismaMock.charityAccount.update.mockResolvedValueOnce(
      makeProfile({ name: "Updated Charity" }),
    );

    const res = await request(app)
      .patch("/api/charity/profile")
      .set("Cookie", CHARITY_COOKIE())
      .send({ name: "Updated Charity" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});
