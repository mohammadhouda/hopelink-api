import prisma from "../../config/prisma.js";
import notificationEmitter, { NOTIFY_USER } from "../../events/notificationEmitter.js";

export async function getApplications(charityId, { skip, take, page, limit, status, opportunityId, from, to } = {}) {

  const createdAtFilter = {};
  if (from) createdAtFilter.gte = new Date(from);
  if (to) createdAtFilter.lte = new Date(to + "T23:59:59.999Z");

  const where = {
    opportunity: { charityId },
    ...(status && { status }),
    ...(opportunityId && { opportunityId }),
    ...(Object.keys(createdAtFilter).length && { createdAt: createdAtFilter }),
  };

  const [applications, total] = await Promise.all([
    prisma.opportunityApplication.findMany({
      where,
      skip,
      take,
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
  notificationEmitter.emit(NOTIFY_USER, {
    userId: application.userId,
    title: "Application Approved!",
    message: `Your application for "${application.opportunity.title}" has been approved. You have been added to the volunteer room.`,
    type: "SUCCESS",
    link: `/user/rooms/${application.opportunityId}`,
  });

  return updated;
}

export async function getApplicantProfile(charityId, applicationId) {
  const application = await prisma.opportunityApplication.findFirst({
    where: { id: applicationId, opportunity: { charityId } },
    select: {
      userId: true,
      message: true,
      status: true,
      createdAt: true,
      opportunityId: true,
      opportunity: { select: { status: true } },
    },
  });
  if (!application) throw { status: 404, message: "Application not found" };

  const user = await prisma.user.findUnique({
    where: { id: application.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      baseProfile: {
        select: { avatarUrl: true, phone: true, city: true, country: true, bio: true },
      },
      volunteerProfile: {
        select: {
          isVerified: true,
          isAvailable: true,
          availabilityDays: true,
          experience: true,
          skills: { select: { skill: true } },
          preferences: { select: { type: true, value: true } },
          experiences: {
            orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
          },
        },
      },
    },
  });

  // Get ratings given by this charity to this volunteer
  const ratings = await prisma.volunteerRating.findMany({
    where: {
      volunteerId: application.userId,
      charityId,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      opportunity: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate average rating from this charity
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  return {
    ...user,
    applicationMessage: application.message,
    applicationStatus: application.status,
    appliedAt: application.createdAt,
    opportunityId: application.opportunityId,
    opportunityStatus: application.opportunity.status,
    ratings,
    avgRating,
    totalRatings: ratings.length,
  };
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
  notificationEmitter.emit(NOTIFY_USER, {
    userId: application.userId,
    title: "Application Declined",
    message: reason
      ? `Your application for "${application.opportunity.title}" was declined: ${reason}`
      : `Your application for "${application.opportunity.title}" has been declined.`,
    type: "WARNING",
    link: `/user/opportunities/${application.opportunityId}`,
  });

  return updated;
}
