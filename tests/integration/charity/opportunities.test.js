import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const CHARITY_COOKIE = () => makeAccessCookie(1, "CHARITY");
const CHARITY_ID = 10;

function charityAuth() {
  mockAuthMiddleware({ id: 1, role: "CHARITY" });
  prismaMock.charityAccount.findUnique.mockResolvedValueOnce({ id: CHARITY_ID });
}

function makeOpportunity(overrides = {}) {
  return {
    id: 1,
    title: "Community Clean-up",
    description: "Clean the park",
    startDate: new Date("2025-06-01"),
    endDate:   new Date("2025-06-30"),
    location:  "Riyadh",
    maxSlots:  10,
    charityId: CHARITY_ID,
    status:    "OPEN",
    requiredSkills:   [],
    availabilityDays: [],
    projectId:  null,
    createdAt:  new Date(),
    ...overrides,
  };
}

describe("POST /api/charity/opportunities", () => {
  it("returns 201 on successful creation", async () => {
    charityAuth();
    prismaMock.volunteeringOpportunity.create.mockResolvedValueOnce(makeOpportunity());

    const res = await request(app)
      .post("/api/charity/opportunities")
      .set("Cookie", CHARITY_COOKIE())
      .send({
        title:     "Community Clean-up",
        description: "Clean the park",
        startDate: "2025-06-01",
        endDate:   "2025-06-30",
        location:  "Riyadh",
        maxSlots:  10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ title: "Community Clean-up" });
  });

  it("returns 403 when authenticated as USER", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .post("/api/charity/opportunities")
      .set("Cookie", makeAccessCookie(2, "USER"))
      .send({ title: "Test" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/charity/opportunities", () => {
  it("returns 200 with paginated opportunities", async () => {
    charityAuth();
    prismaMock.volunteeringOpportunity.findMany.mockResolvedValueOnce([makeOpportunity()]);
    prismaMock.volunteeringOpportunity.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get("/api/charity/opportunities")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.opportunities).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });
});

describe("GET /api/charity/opportunities/:id", () => {
  it("returns 200 for an existing opportunity", async () => {
    charityAuth();
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(makeOpportunity());

    const res = await request(app)
      .get("/api/charity/opportunities/1")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it("returns 404 when the opportunity does not belong to this charity", async () => {
    charityAuth();
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/charity/opportunities/999")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/charity/opportunities/:id", () => {
  it("returns 200 with updated opportunity", async () => {
    charityAuth();
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(makeOpportunity());
    prismaMock.volunteeringOpportunity.update.mockResolvedValueOnce(
      makeOpportunity({ title: "Updated" }),
    );

    const res = await request(app)
      .patch("/api/charity/opportunities/1")
      .set("Cookie", CHARITY_COOKIE())
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});

describe("DELETE /api/charity/opportunities/:id", () => {
  it("returns 200 on successful deletion", async () => {
    charityAuth();
    prismaMock.volunteeringOpportunity.findFirst.mockResolvedValueOnce(makeOpportunity());
    prismaMock.volunteeringOpportunity.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete("/api/charity/opportunities/1")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
