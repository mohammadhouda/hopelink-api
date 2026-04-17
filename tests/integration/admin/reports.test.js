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

describe("GET /api/admin/reports/registration", () => {
  it("returns 200 with report data", async () => {
    adminAuth();
    prismaMock.registrationRequest.count.mockResolvedValue(50);
    prismaMock.registrationRequest.groupBy.mockResolvedValue([
      { status: "APPROVED", _count: { id: 30 } },
      { status: "DECLINED", _count: { id: 10 } },
      { status: "PENDING",  _count: { id: 10 } },
    ]);
    prismaMock.$queryRaw.mockResolvedValue([
      { month: "Jan", year: 2025, count: 10 },
    ]);
    prismaMock.registrationRequest.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/admin/reports/registration")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("returns 403 for non-admin", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/admin/reports/registration")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/reports/ngos", () => {
  it("returns 200 with NGO report data", async () => {
    adminAuth();
    prismaMock.charityAccount.count.mockResolvedValue(20);
    prismaMock.charityAccount.groupBy.mockResolvedValue([]);
    prismaMock.charityAccount.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/admin/reports/ngos")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/admin/reports/users", () => {
  it("returns 200 with user report data", async () => {
    adminAuth();
    prismaMock.user.count.mockResolvedValue(100);
    prismaMock.user.groupBy.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/admin/reports/users")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/admin/reports/filters", () => {
  it("returns 200 with filter options", async () => {
    adminAuth();
    prismaMock.registrationRequest.findMany.mockResolvedValue([]);
    prismaMock.charityAccount.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/admin/reports/filters")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
