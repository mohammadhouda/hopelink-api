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

function makePendingRequest(overrides = {}) {
  return {
    id: 7,
    name: "Hope NGO",
    email: "hope@example.com",
    status: "PENDING",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("GET /api/admin/requests/registration", () => {
  it("returns 200 with pending registration requests", async () => {
    adminAuth();
    prismaMock.$transaction.mockResolvedValueOnce([
      [makePendingRequest()],
      1,
    ]);

    const res = await request(app)
      .get("/api/admin/requests/registration")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it("returns 200 with message when no requests found", async () => {
    adminAuth();
    prismaMock.$transaction.mockResolvedValueOnce([[], 0]);

    const res = await request(app)
      .get("/api/admin/requests/registration")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no registration requests/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/requests/registration");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/requests/registration/:id", () => {
  it("returns 200 with a single request", async () => {
    adminAuth();
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(makePendingRequest());

    const res = await request(app)
      .get("/api/admin/requests/registration/7")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 7 });
  });

  it("returns 500 when not found", async () => {
    adminAuth();
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/admin/requests/registration/999")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe("PATCH /api/admin/requests/registration/:id/approve", () => {
  it("returns 200 and creates the charity account", async () => {
    adminAuth();
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(makePendingRequest());
    prismaMock.user.findUnique.mockResolvedValueOnce(null); // no existing user
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    prismaMock.user.create.mockResolvedValueOnce({ id: 50 });
    prismaMock.charityAccount.create.mockResolvedValueOnce({ id: 5, userId: 50 });
    prismaMock.registrationRequest.update.mockResolvedValueOnce({
      ...makePendingRequest(),
      status: "APPROVED",
    });

    const res = await request(app)
      .patch("/api/admin/requests/registration/7/approve")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/approved/i);
  });
});

describe("PATCH /api/admin/requests/registration/:id/decline", () => {
  it("returns 200 on successful decline", async () => {
    adminAuth();
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(makePendingRequest());
    prismaMock.registrationRequest.update.mockResolvedValueOnce({
      ...makePendingRequest(),
      status: "DECLINED",
    });

    const res = await request(app)
      .patch("/api/admin/requests/registration/7/decline")
      .set("Cookie", ADMIN_COOKIE())
      .send({ reviewNote: "Insufficient documentation" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
