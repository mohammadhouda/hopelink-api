import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { prismaMock } from "../../helpers/db.helper.js";

// Mock prisma and email service before importing the service under test
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: prismaMock,
}));

jest.unstable_mockModule("../../../src/services/email.service.js", () => ({
  sendRegistrationApprovedEmail: jest.fn().mockResolvedValue({}),
  sendRegistrationDeclinedEmail: jest.fn().mockResolvedValue({}),
  sendVerificationApprovedEmail: jest.fn().mockResolvedValue({}),
  sendVerificationDeclinedEmail: jest.fn().mockResolvedValue({}),
}));

const {
  getRegistrationRequestsService,
  getRegistrationRequestService,
  createRegistrationRequestService,
  approveRegistrationRequestService,
  declineRegistrationRequestService,
  getVerificationRequestsService,
  getVerificationRequestService,
  createVerificationRequestService,
  approveVerificationRequestService,
  declineVerificationRequestService,
} = await import("../../../src/services/admin/requests.service.js");

// ── Registration Requests ─────────────────────────────────────────────────────

describe("getRegistrationRequestsService()", () => {
  it("returns items and total with no filter", async () => {
    const items = [{ id: 1, name: "Org A", status: "PENDING" }];
    prismaMock.$transaction.mockResolvedValueOnce([items, 1]);

    const result = await getRegistrationRequestsService();

    expect(result).toEqual({ items, total: 1 });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe("getRegistrationRequestService()", () => {
  it("returns the request when found", async () => {
    const request = { id: 7, name: "Hope NGO", status: "PENDING" };
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(request);

    const result = await getRegistrationRequestService(7);

    expect(result).toEqual(request);
    expect(prismaMock.registrationRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
    });
  });

  it("throws when the request is not found", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(null);

    await expect(getRegistrationRequestService(999)).rejects.toThrow(
      "Registration request not found.",
    );
  });
});

describe("createRegistrationRequestService()", () => {
  const VALID_DATA = {
    name: "Hope Org",
    email: "hope@example.com",
    phone: "0501234567",
    city: "Lebanon",
    category: "EDUCATION",
    message: "We want to help.",
  };

  it("creates and returns a new registration request", async () => {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const created = { id: 1, ...VALID_DATA, status: "PENDING", createdAt: new Date() };
    prismaMock.registrationRequest.create.mockResolvedValueOnce(created);

    const result = await createRegistrationRequestService(VALID_DATA);

    expect(result).toEqual(created);
    expect(prismaMock.registrationRequest.create).toHaveBeenCalledTimes(1);
  });

  it("throws when a PENDING request for this email already exists", async () => {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce({ id: 5 });

    await expect(createRegistrationRequestService(VALID_DATA)).rejects.toThrow(
      "A pending request for this email already exists.",
    );
    expect(prismaMock.registrationRequest.create).not.toHaveBeenCalled();
  });

  it("throws when a user account with the email already exists", async () => {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 10, email: VALID_DATA.email });

    await expect(createRegistrationRequestService(VALID_DATA)).rejects.toThrow(
      "An account with this email already exists.",
    );
    expect(prismaMock.registrationRequest.create).not.toHaveBeenCalled();
  });

  it("stores null for optional fields when they are omitted", async () => {
    prismaMock.registrationRequest.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.registrationRequest.create.mockResolvedValueOnce({ id: 2 });

    await createRegistrationRequestService({ name: "X", email: "x@x.com" });

    expect(prismaMock.registrationRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: null, city: null, category: null, message: null }),
      }),
    );
  });
});

describe("approveRegistrationRequestService()", () => {
  const PENDING = { id: 7, name: "Hope NGO", email: "hope@example.com", status: "PENDING", phone: null, city: null, category: null };

  it("creates user + charity account and returns { userId, tempPassword }", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(PENDING);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.$transaction.mockImplementationOnce(async (cb) => cb(prismaMock));
    prismaMock.user.create.mockResolvedValueOnce({ id: 50 });
    prismaMock.charityAccount.create.mockResolvedValueOnce({ id: 5 });
    prismaMock.registrationRequest.update.mockResolvedValueOnce({ ...PENDING, status: "APPROVED" });

    const result = await approveRegistrationRequestService(7, 1);

    expect(result).toHaveProperty("userId", 50);
    expect(result).toHaveProperty("tempPassword");
    expect(typeof result.tempPassword).toBe("string");
    expect(prismaMock.charityAccount.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.registrationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "APPROVED", reviewedBy: 1 }),
      }),
    );
  });

  it("throws when the request is not found", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(null);

    await expect(approveRegistrationRequestService(999, 1)).rejects.toThrow(
      "Request not found.",
    );
  });

  it("throws when the request is not pending", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce({
      ...PENDING,
      status: "APPROVED",
    });

    await expect(approveRegistrationRequestService(7, 1)).rejects.toThrow(
      "Request is no longer pending.",
    );
  });

  it("throws when a user with the email already exists", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(PENDING);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 99, email: PENDING.email });

    await expect(approveRegistrationRequestService(7, 1)).rejects.toThrow(
      "An account with this email already exists.",
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("declineRegistrationRequestService()", () => {
  const PENDING = { id: 7, name: "Hope NGO", email: "hope@example.com", status: "PENDING" };

  it("updates status to DECLINED and returns the updated request", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(PENDING);
    const updated = { ...PENDING, status: "DECLINED", reviewNote: "Missing docs" };
    prismaMock.registrationRequest.update.mockResolvedValueOnce(updated);

    const result = await declineRegistrationRequestService(7, 1, "Missing docs");

    expect(result.status).toBe("DECLINED");
    expect(prismaMock.registrationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DECLINED", reviewNote: "Missing docs", reviewedBy: 1 }),
      }),
    );
  });

  it("throws when the request is not found", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(null);

    await expect(declineRegistrationRequestService(999, 1)).rejects.toThrow(
      "Request not found.",
    );
  });

  it("throws when the request is no longer pending", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce({
      ...PENDING,
      status: "DECLINED",
    });

    await expect(declineRegistrationRequestService(7, 1)).rejects.toThrow(
      "Request is no longer pending.",
    );
  });

  it("stores null for reviewNote when not provided", async () => {
    prismaMock.registrationRequest.findUnique.mockResolvedValueOnce(PENDING);
    prismaMock.registrationRequest.update.mockResolvedValueOnce({
      ...PENDING,
      status: "DECLINED",
      reviewNote: null,
    });

    await declineRegistrationRequestService(7, 1);

    expect(prismaMock.registrationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewNote: null }),
      }),
    );
  });
});

// ── Verification Requests ─────────────────────────────────────────────────────

describe("getVerificationRequestsService()", () => {
  it("returns items and total", async () => {
    const items = [{ id: 1, status: "PENDING" }];
    prismaMock.$transaction.mockResolvedValueOnce([items, 1]);

    const result = await getVerificationRequestsService();

    expect(result).toEqual({ items, total: 1 });
  });

  it("filters by status when provided", async () => {
    prismaMock.$transaction.mockResolvedValueOnce([[], 0]);

    const result = await getVerificationRequestsService({ status: "APPROVED" });

    expect(result.total).toBe(0);
  });
});

describe("getVerificationRequestService()", () => {
  it("returns the verification request when found", async () => {
    const req = { id: 3, status: "PENDING", userId: 10, user: { email: "x@x.com" } };
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(req);

    const result = await getVerificationRequestService(3);

    expect(result).toEqual(req);
    expect(prismaMock.verificationRequest.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 3 } }),
    );
  });

  it("throws when not found", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(null);

    await expect(getVerificationRequestService(999)).rejects.toThrow(
      "Verification request not found.",
    );
  });
});

describe("createVerificationRequestService()", () => {
  const CHARITY = { id: 5, userId: 10, isVerified: false };

  it("creates a verification request with documents", async () => {
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(CHARITY);
    prismaMock.verificationRequest.findFirst.mockResolvedValueOnce(null);
    const created = { id: 1, userId: 10, documents: ["doc.pdf"], status: "PENDING" };
    prismaMock.verificationRequest.create.mockResolvedValueOnce(created);

    const result = await createVerificationRequestService(10, {
      documents: ["doc.pdf"],
      message: "Please verify us",
    });

    expect(result).toEqual(created);
    expect(prismaMock.verificationRequest.create).toHaveBeenCalledTimes(1);
  });

  it("throws when charity account is not found", async () => {
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(null);

    await expect(
      createVerificationRequestService(10, { documents: ["doc.pdf"] }),
    ).rejects.toThrow("Charity account not found.");
  });

  it("throws when charity is already verified", async () => {
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce({ ...CHARITY, isVerified: true });

    await expect(
      createVerificationRequestService(10, { documents: ["doc.pdf"] }),
    ).rejects.toThrow("This charity is already verified.");
  });

  it("throws when a PENDING verification request already exists", async () => {
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(CHARITY);
    prismaMock.verificationRequest.findFirst.mockResolvedValueOnce({ id: 2 });

    await expect(
      createVerificationRequestService(10, { documents: ["doc.pdf"] }),
    ).rejects.toThrow("A pending verification request already exists.");
  });

  it("throws when no documents are provided", async () => {
    prismaMock.charityAccount.findUnique.mockResolvedValueOnce(CHARITY);
    prismaMock.verificationRequest.findFirst.mockResolvedValueOnce(null);

    await expect(
      createVerificationRequestService(10, { documents: [] }),
    ).rejects.toThrow("At least one document is required.");
  });
});

describe("approveVerificationRequestService()", () => {
  const PENDING_VER = {
    id: 4,
    userId: 10,
    status: "PENDING",
    user: { email: "charity@example.com", charityAccount: { name: "Good Org" } },
  };

  it("marks charity as verified and updates request to APPROVED", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(PENDING_VER);
    prismaMock.$transaction.mockImplementationOnce(async (cb) => cb(prismaMock));
    prismaMock.charityAccount.update.mockResolvedValueOnce({ isVerified: true });
    const updated = { ...PENDING_VER, status: "APPROVED" };
    prismaMock.verificationRequest.update.mockResolvedValueOnce(updated);

    const result = await approveVerificationRequestService(4, 1);

    expect(result.status).toBe("APPROVED");
    expect(prismaMock.charityAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isVerified: true } }),
    );
  });

  it("throws when the request is not found", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(null);

    await expect(approveVerificationRequestService(999, 1)).rejects.toThrow(
      "Request not found.",
    );
  });

  it("throws when the request is no longer pending", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce({
      ...PENDING_VER,
      status: "APPROVED",
    });

    await expect(approveVerificationRequestService(4, 1)).rejects.toThrow(
      "Request is no longer pending.",
    );
  });
});

describe("declineVerificationRequestService()", () => {
  const PENDING_VER = {
    id: 4,
    userId: 10,
    status: "PENDING",
    user: { email: "charity@example.com", charityAccount: { name: "Good Org" } },
  };

  it("updates the request to DECLINED", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(PENDING_VER);
    const updated = { ...PENDING_VER, status: "DECLINED", reviewNote: "Docs unclear" };
    prismaMock.verificationRequest.update.mockResolvedValueOnce(updated);

    const result = await declineVerificationRequestService(4, 1, "Docs unclear");

    expect(result.status).toBe("DECLINED");
    expect(prismaMock.verificationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DECLINED", reviewNote: "Docs unclear" }),
      }),
    );
  });

  it("throws when the request is not found", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(null);

    await expect(declineVerificationRequestService(999, 1)).rejects.toThrow(
      "Request not found.",
    );
  });

  it("throws when the request is no longer pending", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce({
      ...PENDING_VER,
      status: "DECLINED",
    });

    await expect(declineVerificationRequestService(4, 1)).rejects.toThrow(
      "Request is no longer pending.",
    );
  });

  it("stores null for reviewNote when not provided", async () => {
    prismaMock.verificationRequest.findUnique.mockResolvedValueOnce(PENDING_VER);
    prismaMock.verificationRequest.update.mockResolvedValueOnce({
      ...PENDING_VER,
      status: "DECLINED",
    });

    await declineVerificationRequestService(4, 1);

    expect(prismaMock.verificationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewNote: null }),
      }),
    );
  });
});
