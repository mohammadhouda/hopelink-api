import prisma from "../../config/prisma.js";
import notificationEmitter, { NOTIFY_USER } from "../../events/notificationEmitter.js";

export async function rateVolunteer(charityId, { volunteerId, opportunityId, rating, comment }) {
  // Validate rating range
  if (rating < 1 || rating > 5) throw { status: 400, message: "Rating must be between 1 and 5" };

  // Ensure opportunity belongs to charity and has ended
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };
  if (opportunity.status !== "ENDED") {
    throw { status: 400, message: "Can only rate volunteers after the opportunity has ended" };
  }

  // Ensure volunteer was approved for this opportunity
  const application = await prisma.opportunityApplication.findFirst({
    where: { userId: volunteerId, opportunityId, status: "APPROVED" },
  });
  if (!application) {
    throw { status: 400, message: "This volunteer did not participate in this opportunity" };
  }

  const ratingRecord = await prisma.volunteerRating.upsert({
    where: { charityId_volunteerId_opportunityId: { charityId, volunteerId, opportunityId } },
    create: { rating, comment, charityId, volunteerId, opportunityId },
    update: { rating, comment },
    include: { opportunity: { select: { title: true } } },
  });

  // Notify volunteer
  notificationEmitter.emit(NOTIFY_USER, {
    userId: volunteerId,
    title: "You received a rating",
    message: `You received a ${rating}/5 rating for "${opportunity.title}".${comment ? ` Comment: ${comment}` : ""}`,
    type: "INFO",
    link: `/user/profile`,
  });

  return ratingRecord;
}

export async function getRatingsGiven(charityId, { skip, take, page, limit, opportunityId } = {}) {
  const where = { charityId, ...(opportunityId && { opportunityId }) };

  const [ratings, total] = await Promise.all([
    prisma.volunteerRating.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        volunteer: { select: { id: true, name: true, email: true } },
        opportunity: { select: { id: true, title: true } },
      },
    }),
    prisma.volunteerRating.count({ where }),
  ]);

  return { ratings, total, page, limit };
}
