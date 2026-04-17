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

function makeUserProfile(overrides = {}) {
  return {
    id: 1,
    name: "Test User",
    email: "user@example.com",
    role: "USER",
    createdAt: new Date(),
    baseProfile: null,
    volunteerProfile: null,
    _count: { opportunityApplications: 0, certificates: 0, ratingsReceived: 0 },
    ...overrides,
  };
}

describe("GET /api/user/profile", () => {
  it("returns 200 with the user profile", async () => {
    userAuth();
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUserProfile());

    const res = await request(app)
      .get("/api/user/profile")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ email: "user@example.com" });
  });

  it("returns 404 when user not found", async () => {
    userAuth();
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/user/profile")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/user/profile");
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as CHARITY", async () => {
    mockAuthMiddleware({ id: 2, role: "CHARITY" });

    const res = await request(app)
      .get("/api/user/profile")
      .set("Cookie", makeAccessCookie(2, "CHARITY"));

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/user/profile", () => {
  it("returns 200 with updated profile", async () => {
    userAuth();
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.baseProfile.upsert.mockResolvedValue({});
    prismaMock.volunteerProfile.upsert.mockResolvedValue({ id: 5, userId: 1 });
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUserProfile({ name: "Updated" }));

    const res = await request(app)
      .patch("/api/user/profile")
      .set("Cookie", USER_COOKIE())
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});

describe("PATCH /api/user/profile/skills", () => {
  it("returns 200 with updated skills list", async () => {
    userAuth();
    prismaMock.volunteerProfile.upsert.mockResolvedValueOnce({ id: 5, userId: 1 });
    prismaMock.volunteerSkill.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.volunteerSkill.createMany.mockResolvedValue({ count: 2 });
    prismaMock.volunteerSkill.findMany.mockResolvedValueOnce([
      { id: 1, skill: "React" },
      { id: 2, skill: "Node" },
    ]);

    const res = await request(app)
      .patch("/api/user/profile/skills")
      .set("Cookie", USER_COOKIE())
      .send({ skills: ["React", "Node"] });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("returns 400 when skills is not an array", async () => {
    userAuth();

    const res = await request(app)
      .patch("/api/user/profile/skills")
      .set("Cookie", USER_COOKIE())
      .send({ skills: "React" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/array/i);
  });
});

describe("PATCH /api/user/profile/preferences", () => {
  it("returns 200 with updated preferences", async () => {
    userAuth();
    prismaMock.volunteerProfile.upsert.mockResolvedValueOnce({ id: 5, userId: 1 });
    prismaMock.volunteerPreference.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.volunteerPreference.createMany.mockResolvedValue({ count: 1 });
    prismaMock.volunteerPreference.findMany.mockResolvedValueOnce([
      { id: 1, type: "CATEGORY", value: "EDUCATION" },
    ]);

    const res = await request(app)
      .patch("/api/user/profile/preferences")
      .set("Cookie", USER_COOKIE())
      .send({ preferences: [{ type: "CATEGORY", value: "EDUCATION" }] });

    expect(res.status).toBe(200);
  });

  it("returns 400 when preferences is not an array", async () => {
    userAuth();

    const res = await request(app)
      .patch("/api/user/profile/preferences")
      .set("Cookie", USER_COOKIE())
      .send({ preferences: "EDUCATION" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/array/i);
  });
});
