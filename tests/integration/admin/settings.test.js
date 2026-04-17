import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const ADMIN_COOKIE = () => makeAccessCookie(1, "ADMIN");

// Settings routes apply authMiddleware twice (app-level + router-level),
// so mockAuthMiddleware must be called twice per request.
function adminAuth() {
  mockAuthMiddleware({ id: 1, role: "ADMIN" });
  mockAuthMiddleware({ id: 1, role: "ADMIN" });
}

describe("GET /api/admin/settings/platform", () => {
  it("returns 200 with platform settings", async () => {
    adminAuth();
    prismaMock.platformSetting.findMany.mockResolvedValueOnce([
      { key: "siteName", value: "Hope Link" },
      { key: "maintenanceMode", value: "false" },
    ]);

    const res = await request(app)
      .get("/api/admin/settings/platform")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("siteName");
    expect(res.body.data).toHaveProperty("maintenanceMode");
  });

  it("returns defaults when no settings are stored", async () => {
    adminAuth();
    prismaMock.platformSetting.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/admin/settings/platform")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data.siteName).toBe("Hope Link");
    expect(res.body.data.maintenanceMode).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/settings/platform");
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin role", async () => {
    mockAuthMiddleware({ id: 2, role: "USER" });

    const res = await request(app)
      .get("/api/admin/settings/platform")
      .set("Cookie", makeAccessCookie(2, "USER"));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/settings/roles", () => {
  it("returns 200 with role list", async () => {
    adminAuth();
    prismaMock.dynamicRole.findMany.mockResolvedValueOnce([
      { id: 1, name: "Editor", description: "Can edit", isSystem: false, createdAt: new Date(), DynamicRolePermission: [] },
    ]);

    const res = await request(app)
      .get("/api/admin/settings/roles")
      .set("Cookie", ADMIN_COOKIE());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe("POST /api/admin/settings/roles", () => {
  it("returns 201 on successful role creation", async () => {
    adminAuth();
    prismaMock.dynamicRole.create.mockResolvedValueOnce({
      id: 2,
      name: "Moderator",
      description: "Moderate content",
      isSystem: false,
      createdAt: new Date(),
      DynamicRolePermission: [],
    });
    prismaMock.auditLog.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post("/api/admin/settings/roles")
      .set("Cookie", ADMIN_COOKIE())
      .send({ name: "Moderator", description: "Moderate content", permissions: [] });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Moderator");
  });

  it("returns 400 when role name is empty", async () => {
    adminAuth();

    const res = await request(app)
      .post("/api/admin/settings/roles")
      .set("Cookie", ADMIN_COOKIE())
      .send({ name: "  " });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});
