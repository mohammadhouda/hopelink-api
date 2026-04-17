import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";
import { makeAccessCookie, mockAuthMiddleware } from "../../helpers/auth.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const RAW_TOKEN = "raw-refresh-token-value";

describe("POST /api/auth/logout", () => {
  it("returns 200 and clears cookies on a valid session", async () => {
    mockAuthMiddleware();
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `${makeAccessCookie()}; refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/logged out/i);

    // Both cookies should be cleared
    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("access_token");
    expect(cookies).toContain("refresh_token");
  });

  it("returns 401 when no access token is provided", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when the refresh token is missing", async () => {
    mockAuthMiddleware();

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", makeAccessCookie());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/required/i);
  });

  it("returns 400 when the refresh token is not found in the DB", async () => {
    mockAuthMiddleware();
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `${makeAccessCookie()}; refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid refresh token");

    // Cookies should still be cleared on failed logout
    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("access_token");
  });
});

describe("POST /api/auth/logout-all", () => {
  it("returns 200 and clears cookies for all sessions", async () => {
    mockAuthMiddleware({ id: 42 });
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post("/api/auth/logout-all")
      .set("Cookie", makeAccessCookie(42));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/all devices/i);

    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 42 } }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/auth/logout-all");

    expect(res.status).toBe(401);
  });
});
