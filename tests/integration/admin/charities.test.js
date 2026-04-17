import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const ADMIN_COOKIE = () => makeAccessCookie(1, "ADMIN");

function adminAuth() {
  mockAuthMiddleware({ id: 1, role: "ADMIN" });
}

function makeCharity(overrides = {}) {
  return {
    id: 5,
    name: "Good Org",
    email: "org@example.com",
    city: "Riyadh",
    category: "EDUCATION",
    isVerified: false,
    isActive: true,
    userId: 20,
    ...overrides,
  };
}

describe("GET /api/admin/charities", () => {
  it("returns 200 with charity list", async () => {
    adminAuth();
    prismaMock.$transaction.mockResolvedValueOnce([
      [makeCharity()],
      [{ count: "1" }],
    ]);

    const res = await request(app)
      .get("/api/admin/charities")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("returns 200 with message when no charities found", async () => {
    adminAuth();
    prismaMock.$transaction.mockResolvedValueOnce([
      [],
      [{ count: "0" }],
    ]);

    const res = await request(app)
      .get("/api/admin/charities")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no active charities/i);
  });

  it("returns 403 for non-admin roles", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/admin/charities")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/charities/:userId", () => {
  it("returns 200 with a specific charity", async () => {
    adminAuth();
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce({
      ...makeCharity(),
      user: { id: 20, email: "org@example.com", isActive: true, lastLoginAt: null, createdAt: new Date() },
      charityProjects: [],
    });
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/admin/charities/20")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: "Good Org" });
  });
});

describe("PATCH /api/admin/charities/:userId", () => {
  it("returns 200 with updated charity", async () => {
    adminAuth();
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([makeCharity()]);
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.user.update.mockResolvedValueOnce({});
    prismaMock.charityAccount.update.mockResolvedValueOnce(makeCharity({ name: "Updated Org" }));

    const res = await request(app)
      .patch("/api/admin/charities/20")
      .set("Cookie", ADMIN_COOKIE())
      .send({ name: "Updated Org" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 400 when no data is provided", async () => {
    adminAuth();

    const res = await request(app)
      .patch("/api/admin/charities/20")
      .set("Cookie", ADMIN_COOKIE())
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/charities/:userId", () => {
  it("returns 200 on soft delete", async () => {
    adminAuth();
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: 20, isActive: true });
    prismaMock.user.update.mockResolvedValueOnce({});

    const res = await request(app)
      .delete("/api/admin/charities/20")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
