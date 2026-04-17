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

function makeApplication(overrides = {}) {
  return {
    id: 1,
    status: "PENDING",
    opportunityId: 5,
    userId: 1,
    message: null,
    createdAt: new Date(),
    opportunity: {
      id: 5,
      title: "Park Clean-up",
      charity: { id: 10, name: "Good Org", logoUrl: null },
    },
    user: { name: "Test User" },
    ...overrides,
  };
}

function makeOpportunity(overrides = {}) {
  return {
    id: 5,
    title: "Park Clean-up",
    status: "OPEN",
    charityId: 10,
    charity: { id: 10, name: "Good Org" },
    ...overrides,
  };
}

describe("GET /api/user/applications", () => {
  it("returns 200 with the user's applications", async () => {
    userAuth();
    prismaMock.opportunityApplication.findMany.mockResolvedValueOnce([makeApplication()]);
    prismaMock.opportunityApplication.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get("/api/user/applications")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.applications).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("returns 403 when authenticated as CHARITY", async () => {
    mockAuthMiddleware({ id: 2, role: "CHARITY" });

    const res = await request(app)
      .get("/api/user/applications")
      .set("Cookie", makeAccessCookie(2, "CHARITY"));

    expect(res.status).toBe(403);
  });
});

describe("POST /api/user/applications/:opportunityId", () => {
  it("returns 201 on a successful application", async () => {
    userAuth();
    prismaMock.volunteeringOpportunity.findUnique.mockResolvedValueOnce(makeOpportunity());
    prismaMock.opportunityApplication.findUnique.mockResolvedValueOnce(null);
    prismaMock.opportunityApplication.create.mockResolvedValueOnce(makeApplication());

    const res = await request(app)
      .post("/api/user/applications/5")
      .set("Cookie", USER_COOKIE())
      .send({ message: "I would love to help!" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/submitted/i);
  });

  it("returns 409 when the user has already applied", async () => {
    userAuth();
    prismaMock.volunteeringOpportunity.findUnique.mockResolvedValueOnce(makeOpportunity());
    prismaMock.opportunityApplication.findUnique.mockResolvedValueOnce(makeApplication());

    const res = await request(app)
      .post("/api/user/applications/5")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already applied/i);
  });

  it("returns 400 when the opportunity is not OPEN", async () => {
    userAuth();
    prismaMock.volunteeringOpportunity.findUnique.mockResolvedValueOnce(
      makeOpportunity({ status: "FULL" }),
    );

    const res = await request(app)
      .post("/api/user/applications/5")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not open/i);
  });

  it("returns 404 when the opportunity is not found", async () => {
    userAuth();
    prismaMock.volunteeringOpportunity.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/user/applications/999")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/user/applications/:id", () => {
  it("returns 200 on successful withdrawal", async () => {
    userAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(makeApplication());
    prismaMock.opportunityApplication.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete("/api/user/applications/1")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/withdrawn/i);
  });

  it("returns 400 when the application is not in PENDING status", async () => {
    userAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(
      makeApplication({ status: "APPROVED" }),
    );

    const res = await request(app)
      .delete("/api/user/applications/1")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/pending/i);
  });

  it("returns 404 when the application is not found", async () => {
    userAuth();
    prismaMock.opportunityApplication.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete("/api/user/applications/999")
      .set("Cookie", USER_COOKIE());

    expect(res.status).toBe(404);
  });
});
