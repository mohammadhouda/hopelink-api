import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

describe("POST /api/auth/register", () => {
  function setupSuccessfulRegister(userId = 1) {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: userId,
      name: "New User",
      email: "new@example.com",
      role: "USER",
    });
    prismaMock.refreshToken.create.mockResolvedValueOnce({ id: "session-1" });
    prismaMock.loginAttempt.create.mockResolvedValue({});
    prismaMock.loginAttempt.deleteMany.mockResolvedValue({ count: 0 });
  }

  it("returns 201 and sets HttpOnly cookies on valid registration", async () => {
    setupSuccessfulRegister();

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "New User", email: "new@example.com", password: "Password123!" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ email: "new@example.com", role: "USER" });

    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("access_token");
    expect(cookies).toContain("refresh_token");
    expect(cookies).toContain("HttpOnly");
  });

  it("does not expose the password hash in the response", async () => {
    setupSuccessfulRegister();

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "New User", email: "new@example.com", password: "Password123!" });

    expect(JSON.stringify(res.body)).not.toContain("$2");
  });

  it("returns 400 when the email is already registered", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, email: "existing@example.com" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "New User", email: "existing@example.com", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already exists");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("returns 400 when the password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "New User", email: "new@example.com", password: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/password/i);
  });
});
