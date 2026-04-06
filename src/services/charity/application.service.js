import prisma from "../../config/prisma.js";
import { createNotification } from "../notification.service.js";

export async function getApplications(charityId, { page = 1, limit = 10, status, opportunityId } = {}) {
  const skip = (page - 1) * limit;

  const where = {
    opportunity: { charityId },
    ...(status && { status }),
    ...(opportunityId && { opportunityId }),
  };

  const [applications, total] = await Promise.all([
    prisma.opportunityApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            baseProfile: { select: { avatarUrl: true, phone: true, city: true } },
            volunteerProfile: { select: { experience: true, isVerified: true } },
          },
        },
        opportunity: { select: { id: true, title: true, startDate: true, endDate: true } },
      },
    }),
    prisma.opportunityApplication.count({ where }),
  ]);

  return { applications, total, page, limit };
}

export async function approveApplication(charityId, applicationId) {
  const application = await prisma.opportunityApplication.findFirst({
    where: { id: applicationId, opportunity: { charityId } },
    include: {
      opportunity: { include: { _count: { select: { applications: { where: { status: "APPROVED" } } } } } },
    },
  });

  if (!application) throw { status: 404, message: "Application not found" };
  if (application.status !== "PENDING") throw { status: 400, message: "Application already reviewed" };

  const approvedCount = application.opportunity._count.applications;
  if (approvedCount >= application.opportunity.maxSlots) {
    throw { status: 400, message: "No slots available" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.opportunityApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED" },
    });

    // Update opportunity status to FULL if slots are now taken
    if (approvedCount + 1 >= application.opportunity.maxSlots) {
      await tx.volunteeringOpportunity.update({
        where: { id: application.opportunityId },
        data: { status: "FULL" },
      });
    }

    // Create or get room and add volunteer as member
    let room = await tx.volunteerRoom.findUnique({
      where: { opportunityId: application.opportunityId },
    });

    if (!room) {
      // Get charity user id to add as ADMIN
      const charity = await tx.charityAccount.findUnique({
        where: { id: charityId },
        select: { userId: true },
      });

      room = await tx.volunteerRoom.create({
        data: { opportunityId: application.opportunityId },
      });

      // Add charity as room admin
      await tx.roomMember.create({
        data: { roomId: room.id, userId: charity.userId, role: "ADMIN" },
      });
    }

    // Add volunteer to room
    await tx.roomMember.upsert({
      where: { roomId_userId: { roomId: room.id, userId: application.userId } },
      create: { roomId: room.id, userId: application.userId, role: "MEMBER" },
      update: {},
    });

    return app;
  });

  // Notify volunteer
  await createNotification({
    userId: application.userId,
    title: "Application Approved!",
    message: `Your application for "${application.opportunity.title}" has been approved. You have been added to the volunteer room.`,
    type: "SUCCESS",
    link: `/opportunities/${application.opportunityId}/room`,
  });

  return updated;
}

export async function declineApplication(charityId, applicationId, { reason } = {}) {
  const application = await prisma.opportunityApplication.findFirst({
    where: { id: applicationId, opportunity: { charityId } },
    include: { opportunity: { select: { title: true } } },
  });

  if (!application) throw { status: 404, message: "Application not found" };
  if (application.status !== "PENDING") throw { status: 400, message: "Application already reviewed" };

  const updated = await prisma.opportunityApplication.update({
    where: { id: applicationId },
    data: { status: "DECLINED" },
  });

  // Notify volunteer
  await createNotification({
    userId: application.userId,
    title: "Application Declined",
    message: reason
      ? `Your application for "${application.opportunity.title}" was declined: ${reason}`
      : `Your application for "${application.opportunity.title}" has been declined.`,
    type: "WARNING",
    link: `/opportunities/${application.opportunityId}`,
  });

  return updated;
}
