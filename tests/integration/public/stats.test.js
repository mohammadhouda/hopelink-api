import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

describe("GET /api/public/stats", () => {
  it("returns 200 with volunteer, charity and opportunity counts", async () => {
    prismaMock.user.count.mockResolvedValue(120);
    prismaMock.charityAccount.count.mockResolvedValue(15);
    prismaMock.volunteeringOpportunity.count.mockResolvedValue(42);

    const res = await request(app).get("/api/public/stats");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      volunteers:    120,
      charities:     15,
      opportunities: 42,
    });
  });

  it("requires no authentication", async () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.charityAccount.count.mockResolvedValue(0);
    prismaMock.volunteeringOpportunity.count.mockResolvedValue(0);

    const res = await request(app).get("/api/public/stats");

    expect(res.status).toBe(200);
  });
});
