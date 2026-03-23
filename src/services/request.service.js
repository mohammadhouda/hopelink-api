import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import {
  sendRegistrationApprovedEmail,
  sendRegistrationDeclinedEmail,
  sendVerificationApprovedEmail,
  sendVerificationDeclinedEmail,
} from "./email.service.js";

// ── Registration Requests
export async function getRegistrationRequestsService({ status, skip = 0, take = 10 } = {}) {
  const where = {};
  if (status && status !== "all") where.status = status;

  const [items, total] = await prisma.$transaction([
    prisma.registrationRequest.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.registrationRequest.count({ where }),
  ]);

  return { items, total };
}

export async function getRegistrationRequestService(id) {
  const request = await prisma.registrationRequest.findUnique({ where: { id: Number(id) } });
  if (!request) throw new Error("Registration request not found.");
  return request;
}

export async function createRegistrationRequestService({ name, email, phone, city, category, message }) {
  const existing = await prisma.registrationRequest.findFirst({ where: { email, status: "PENDING" } });
  if (existing) throw new Error("A pending request for this email already exists.");

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) throw new Error("An account with this email already exists.");

  return prisma.registrationRequest.create({
    data: {
      name,
      email,
      phone:    phone    || null,
      city:     city     || null,
      category: category || null,
      message:  message  || null,
    },
  });
}

export async function approveRegistrationRequestService(id, adminId) {
  const request = await prisma.registrationRequest.findUnique({ where: { id: Number(id) } });

  if (!request)                     throw new Error("Request not found.");
  if (request.status !== "PENDING") throw new Error("Request is no longer pending.");

  const userExists = await prisma.user.findUnique({ where: { email: request.email } });
  if (userExists) throw new Error("An account with this email already exists.");

  const tempPassword   = Math.random().toString(36).slice(-10);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name:     request.name,
        email:    request.email,
        password: hashedPassword,
        role:     "CHARITY",
        isActive: true,
      },
    });

    await tx.charityAccount.create({
      data: {
        name:     request.name,
        phone:    request.phone    || null,
        city:     request.city     || null,
        category: request.category || null,
        userId:   user.id,
      },
    });

    await tx.registrationRequest.update({
      where: { id: Number(id) },
      data: { status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date() },
    });

    return { userId: user.id, tempPassword };
  });

  // Send approval email with temp password
  sendRegistrationApprovedEmail({
    name:         request.name,
    email:        request.email,
    tempPassword: result.tempPassword,
  }).catch((err) => console.error("Failed to send registration approval email:", err));

  return result;
}

export async function declineRegistrationRequestService(id, adminId, reviewNote) {
  const request = await prisma.registrationRequest.findUnique({ where: { id: Number(id) } });

  if (!request)                     throw new Error("Request not found.");
  if (request.status !== "PENDING") throw new Error("Request is no longer pending.");

  const updated = await prisma.registrationRequest.update({
    where: { id: Number(id) },
    data: {
      status:     "DECLINED",
      reviewNote: reviewNote || null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  // Send decline email
  sendRegistrationDeclinedEmail({
    name:       request.name,
    email:      request.email,
    reviewNote: reviewNote || null,
  }).catch((err) => console.error("Failed to send registration decline email:", err));

  return updated;
}

// ── Verification Requests
export async function getVerificationRequestsService({ status, skip = 0, take = 10 } = {}) {
  const where = {};
  if (status && status !== "all") where.status = status;

  const [items, total] = await prisma.$transaction([
    prisma.verificationRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            charityAccount: {
              select: { id: true, name: true, logoUrl: true, city: true, category: true, isVerified: true },
            },
          },
        },
      },
    }),
    prisma.verificationRequest.count({ where }),
  ]);

  return { items, total };
}

export async function getVerificationRequestService(id) {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          charityAccount: {
            select: { id: true, name: true, logoUrl: true, city: true, category: true, isVerified: true, phone: true, websiteUrl: true },
          },
        },
      },
    },
  });

  if (!request) throw new Error("Verification request not found.");
  return request;
}

export async function createVerificationRequestService(userId, { documents, message }) {
  const charity = await prisma.charityAccount.findUnique({ where: { userId: Number(userId) } });

  if (!charity)           throw new Error("Charity account not found.");
  if (charity.isVerified) throw new Error("This charity is already verified.");

  const existing = await prisma.verificationRequest.findFirst({
    where: { userId: Number(userId), status: "PENDING" },
  });
  if (existing) throw new Error("A pending verification request already exists.");

  if (!documents || documents.length === 0) throw new Error("At least one document is required.");

  return prisma.verificationRequest.create({
    data: { userId: Number(userId), documents, message: message || null },
  });
}

export async function approveVerificationRequestService(id, adminId) {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: {
          email: true,
          charityAccount: { select: { name: true } },
        },
      },
    },
  });

  if (!request)                     throw new Error("Request not found.");
  if (request.status !== "PENDING") throw new Error("Request is no longer pending.");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.charityAccount.update({
      where: { userId: request.userId },
      data:  { isVerified: true },
    });

    return tx.verificationRequest.update({
      where: { id: Number(id) },
      data: { status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date() },
    });
  });

  // Send verification approval email
  sendVerificationApprovedEmail({
    charityName: request.user.charityAccount?.name ?? "Your charity",
    email:       request.user.email,
  }).catch((err) => console.error("Failed to send verification approval email:", err));

  return updated;
}

export async function declineVerificationRequestService(id, adminId, reviewNote) {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: {
          email: true,
          charityAccount: { select: { name: true } },
        },
      },
    },
  });

  if (!request)                     throw new Error("Request not found.");
  if (request.status !== "PENDING") throw new Error("Request is no longer pending.");

  const updated = await prisma.verificationRequest.update({
    where: { id: Number(id) },
    data: {
      status:     "DECLINED",
      reviewNote: reviewNote || null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  // Send verification decline email
  sendVerificationDeclinedEmail({
    charityName: request.user.charityAccount?.name ?? "Your charity",
    email:       request.user.email,
    reviewNote:  reviewNote || null,
  }).catch((err) => console.error("Failed to send verification decline email:", err));

  return updated;
}