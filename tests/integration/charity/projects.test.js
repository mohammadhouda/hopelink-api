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

function makeProject(overrides = {}) {
  return {
    id: 1,
    title: "Build a School",
    description: "Construction project",
    category: "EDUCATION",
    startDate: new Date("2025-09-01"),
    endDate:   new Date("2025-12-31"),
    status:    "ACTIVE",
    charityId: CHARITY_ID,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("POST /api/charity/projects", () => {
  it("returns 201 on successful creation", async () => {
    charityAuth();
    prismaMock.charityProject.create.mockResolvedValueOnce(makeProject());

    const res = await request(app)
      .post("/api/charity/projects")
      .set("Cookie", CHARITY_COOKIE())
      .send({
        title:       "Build a School",
        description: "Construction project",
        category:    "EDUCATION",
        startDate:   "2025-09-01",
        endDate:     "2025-12-31",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ title: "Build a School" });
  });

  it("returns 403 when authenticated as USER", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .post("/api/charity/projects")
      .set("Cookie", makeAccessCookie(2, "USER"))
      .send({ title: "Test" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/charity/projects", () => {
  it("returns 200 with paginated projects including application counts", async () => {
    charityAuth();
    prismaMock.charityProject.findMany.mockResolvedValueOnce([makeProject()]);
    prismaMock.charityProject.count.mockResolvedValueOnce(1);
    // getApplicationCountsByProject uses $queryRawUnsafe
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      { id: 1, applicationCount: 3 },
    ]);

    const res = await request(app)
      .get("/api/charity/projects")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.projects).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });
});

describe("GET /api/charity/projects/:id", () => {
  it("returns 200 for an existing project", async () => {
    charityAuth();
    prismaMock.charityProject.findFirst.mockResolvedValueOnce({
      ...makeProject(),
      opportunities: [],
    });

    const res = await request(app)
      .get("/api/charity/projects/1")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  it("returns 404 when the project does not belong to this charity", async () => {
    charityAuth();
    prismaMock.charityProject.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/charity/projects/999")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/charity/projects/:id", () => {
  it("returns 200 with updated project", async () => {
    charityAuth();
    prismaMock.charityProject.findFirst.mockResolvedValueOnce(makeProject());
    prismaMock.charityProject.update.mockResolvedValueOnce(
      makeProject({ title: "Updated Project" }),
    );

    const res = await request(app)
      .patch("/api/charity/projects/1")
      .set("Cookie", CHARITY_COOKIE())
      .send({ title: "Updated Project" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});

describe("DELETE /api/charity/projects/:id", () => {
  it("returns 200 on successful deletion", async () => {
    charityAuth();
    prismaMock.charityProject.findFirst.mockResolvedValueOnce(makeProject());
    prismaMock.charityProject.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete("/api/charity/projects/1")
      .set("Cookie", CHARITY_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
