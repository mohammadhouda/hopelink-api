import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { hashToken } from "../../../src/utils/security.js";
import { prismaMock } from "../../helpers/db.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

describe("POST /api/auth/refresh", () => {
  const RAW_TOKEN = "raw-refresh-token-value";
  const HASHED_TOKEN = hashToken(RAW_TOKEN);

  function makeStoredToken(overrides = {}) {
    return {
      id: "token-1",
      token: HASHED_TOKEN,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      family: "family-1",
      userId: 1,
      user: { id: 1, role: "USER" },
      ...overrides,
    };
  }

  function setupSuccessfulRefresh() {
    const stored = makeStoredToken();
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce(stored);

    // $transaction mock — passes the prismaMock as the tx argument
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));

    // Inside the transaction:
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce(stored); // double-check
    prismaMock.refreshToken.update.mockResolvedValue({});
    prismaMock.refreshToken.create.mockResolvedValue({ id: "token-2" });
  }

  it("returns 200 and rotates both cookies when the token is valid", async () => {
    setupSuccessfulRefresh();

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("access_token");
    expect(cookies).toContain("refresh_token");
    expect(cookies).toContain("HttpOnly");
  });

  it("returns 401 and clears cookies when no refresh token is provided", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);

    const cookies = res.headers["set-cookie"]?.join(";") ?? "";
    // Cookies should be cleared (Max-Age=0 or Expires in the past)
    expect(cookies).toContain("access_token");
  });

  it("returns 401 when the token does not exist in the DB", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid refresh token");
  });

  it("returns 401 when the token is expired", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce(
      makeStoredToken({ expiresAt: new Date(Date.now() - 1000) }),
    );
    prismaMock.refreshToken.delete.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  it("returns 403 and revokes the entire token family when a revoked token is reused", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce(
      makeStoredToken({ isRevoked: true }),
    );
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/reuse/i);
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { family: "family-1" } }),
    );
  });

  it("returns 401 when the token is consumed inside the transaction (race condition)", async () => {
    const stored = makeStoredToken();
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce(stored);

    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
    // Double-check inside tx returns revoked
    prismaMock.refreshToken.findUnique.mockResolvedValueOnce({ ...stored, isRevoked: true });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${RAW_TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/already used/i);
  });
});
