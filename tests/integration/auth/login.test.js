import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import { prismaMock } from "../../helpers/db.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

describe("POST /api/auth/login", () => {
  let hashedPassword;

  beforeAll(async () => {
    // Low bcrypt rounds so the test suite runs fast.
    hashedPassword = await bcrypt.hash("Password123!", 1);
  });

  function makeUser(overrides = {}) {
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
      role: "USER",
      isActive: true,
      ...overrides,
    };
  }

  // Mock every prisma call that the happy-path loginService makes.
  function setupSuccessfulLogin(user) {
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.accountLockout.findUnique.mockResolvedValue(null);
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.accountLockout.delete.mockResolvedValue({}); // clearLockout — must be a Promise
    prismaMock.refreshToken.findMany.mockResolvedValue([]);  // detectSuspiciousActivity
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.refreshToken.create.mockResolvedValue({ id: "session-1" });
    prismaMock.user.update.mockResolvedValue(user);
  }

  it("returns 200 and sets HttpOnly cookies on valid credentials", async () => {
    const user = makeUser();
    setupSuccessfulLogin(user);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ email: "test@example.com", role: "USER" });

    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("access_token");
    expect(cookies).toContain("refresh_token");
    expect(cookies).toContain("HttpOnly");
  });

  it("does not expose the password hash in the response", async () => {
    const user = makeUser();
    setupSuccessfulLogin(user);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password123!" });

    expect(JSON.stringify(res.body)).not.toContain(hashedPassword);
  });

  it("returns 400 for wrong password", async () => {
    const user = makeUser();
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.accountLockout.findUnique.mockResolvedValue(null);
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.loginAttempt.count.mockResolvedValue(1); // handleFailedLogin
    prismaMock.accountLockout.upsert.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "WrongPassword!" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid credentials");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("returns 400 for unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("returns 400 for a deactivated account", async () => {
    const user = makeUser({ isActive: false });
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.accountLockout.findUnique.mockResolvedValue(null);
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Account is deactivated");
  });

  it("returns 429 when the account is locked out", async () => {
    const user = makeUser();
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.accountLockout.findUnique.mockResolvedValue({
      userId: user.id,
      lockoutUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
      attempts: 5,
    });
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password123!" });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/locked/i);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("locks the account after exceeding max failed attempts", async () => {
    const user = makeUser();
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.accountLockout.findUnique.mockResolvedValue(null);
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });
    // handleFailedLogin: attempt count >= MAX_FAILED_ATTEMPTS (5) → lock
    prismaMock.loginAttempt.count.mockResolvedValue(5);
    prismaMock.accountLockout.upsert.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "WrongPassword!" });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/locked/i);
    expect(prismaMock.accountLockout.upsert).toHaveBeenCalledTimes(1);
  });

  it("includes a warning when login originates from a suspicious new location", async () => {
    const user = makeUser();
    setupSuccessfulLogin(user);
    // Override: 6 distinct IPs in last 24 h (> maxPerUser=5) → suspicious
    prismaMock.refreshToken.findMany.mockResolvedValue([
      { ipAddress: "1.1.1.1" },
      { ipAddress: "2.2.2.2" },
      { ipAddress: "3.3.3.3" },
      { ipAddress: "4.4.4.4" },
      { ipAddress: "5.5.5.5" },
      { ipAddress: "6.6.6.6" },
    ]);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.data.warning).toBe("New login location detected");
  });

  it("returns 200 without a warning for a normal login location", async () => {
    const user = makeUser();
    setupSuccessfulLogin(user);
    // Only 1 session IP → not suspicious
    prismaMock.refreshToken.findMany.mockResolvedValue([{ ipAddress: "127.0.0.1" }]);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.data.warning).toBeUndefined();
  });
});
