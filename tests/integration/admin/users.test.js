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

function makeUser(overrides = {}) {
  return {
    id: 10,
    name: "Test User",
    email: "user@example.com",
    role: "USER",
    isActive: true,
    createdAt: new Date(),
    lastLoginAt: null,
    baseProfile: null,
    ...overrides,
  };
}

describe("GET /api/admin/users", () => {
  it("returns 200 with paginated users", async () => {
    adminAuth();
    prismaMock.$transaction.mockResolvedValueOnce([
      [makeUser()],
      [{ count: "1" }],
    ]);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
  });

  it("returns 200 with message when no users found", async () => {
    adminAuth();
    prismaMock.$transaction.mockResolvedValueOnce([
      [],
      [{ count: "0" }],
    ]);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no users found/i);
  });

  it("returns 403 for non-admin roles", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/users/:userId", () => {
  it("returns 200 with a specific user", async () => {
    adminAuth();
    prismaMock.user.findFirst.mockResolvedValueOnce(makeUser());

    const res = await request(app)
      .get("/api/admin/users/10")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 10, email: "user@example.com" });
  });

  it("returns 500 when user is not found", async () => {
    adminAuth();
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/admin/users/999")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/users/:userId", () => {
  it("returns 200 with updated user", async () => {
    adminAuth();
    const user = makeUser();
    prismaMock.user.findFirst.mockResolvedValueOnce(user);
    prismaMock.user.findUnique.mockResolvedValueOnce(null); // email uniqueness check
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.user.update.mockResolvedValueOnce({});
    prismaMock.baseProfile.upsert.mockResolvedValueOnce({});
    prismaMock.user.findUnique.mockResolvedValueOnce({ ...user, name: "Updated" });

    const res = await request(app)
      .patch("/api/admin/users/10")
      .set("Cookie", ADMIN_COOKIE())
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 400 when no data is provided", async () => {
    adminAuth();

    const res = await request(app)
      .patch("/api/admin/users/10")
      .set("Cookie", ADMIN_COOKIE())
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/admin/users/:userId", () => {
  it("returns 200 on soft delete", async () => {
    adminAuth();
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.user.findFirst.mockResolvedValueOnce(makeUser());
    prismaMock.user.update.mockResolvedValueOnce({});

    const res = await request(app)
      .delete("/api/admin/users/10")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
