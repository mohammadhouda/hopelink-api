import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

function setupDashboardMocks() {
  // prisma.registrationRequest.count — pending registrations
  prismaMock.registrationRequest.count.mockResolvedValue(3);
  // prisma.verificationRequest.count — pending verifications
  prismaMock.verificationRequest.count.mockResolvedValue(2);
  // prisma.user.count — active users (called twice: total + beforeThisMonth)
  prismaMock.user.count.mockResolvedValue(100);
  // $queryRaw — registration trends
  prismaMock.$queryRaw.mockResolvedValue([
    { month: "Jan", year: 2025, count: 10 },
  ]);
  // charityAccount.groupBy — NGOs by city
  prismaMock.charityAccount.groupBy.mockResolvedValue([
    { city: "Riyadh", _count: { id: 5 } },
  ]);
  // registrationRequest.findMany — pending list
  prismaMock.registrationRequest.findMany.mockResolvedValue([]);
  // verificationRequest.findMany — pending verifications list
  prismaMock.verificationRequest.findMany.mockResolvedValue([]);
  // charityProject.count — active + total projects (called twice)
  prismaMock.charityProject.count.mockResolvedValue(8);
}

describe("GET /api/admin/dashboard/stats", () => {
  it("returns 200 with KPI data for an ADMIN user", async () => {
    mockAuthMiddleware({ id: 1, role: "ADMIN" });
    setupDashboardMocks();

    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Cookie", makeAccessCookie(1, "ADMIN"));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("metrics");
    expect(res.body.data).toHaveProperty("registrationTrends");
    expect(res.body.data).toHaveProperty("ngosByCity");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/dashboard/stats");
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as USER", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});
