import { describe, it, expect, jest } from "@jest/globals";
import request from "supertest";
import { prismaMock } from "../../helpers/db.helper.js";

jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

const { default: app } = await import("../../../src/app.js");

const VALID_BODY = {
  name:     "Helping Hands",
  email:    "ngo@example.com",
  phone:    "0501234567",
  city:     "Riyadh",
  category: "EDUCATION",
  message:  "We want to volunteer.",
};

describe("POST /api/public/registration", () => {
  function setupSuccessfulSubmit() {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.registrationRequest.create.mockResolvedValueOnce({
      id: 1,
      ...VALID_BODY,
      status: "PENDING",
      createdAt: new Date(),
    });
  }

  it("returns 201 on a valid submission", async () => {
    setupSuccessfulSubmit();

    const res = await request(app)
      .post("/api/public/registration")
      .send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/submitted/i);
    expect(res.body.data).toMatchObject({ email: "ngo@example.com" });
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/public/registration")
      .send({ ...VALID_BODY, name: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/public/registration")
      .send({ ...VALID_BODY, email: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 500 when a pending request for the email already exists", async () => {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce({ id: 99 });

    const res = await request(app)
      .post("/api/public/registration")
      .send(VALID_BODY);

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/pending request/i);
  });

  it("returns 500 when a user account with this email already exists", async () => {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 5, email: "ngo@example.com" });

    const res = await request(app)
      .post("/api/public/registration")
      .send(VALID_BODY);

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/account with this email/i);
  });
});
