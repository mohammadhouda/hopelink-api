import prisma from "../../config/prisma.js";

export async function getMyApplications(userId, { page = 1, limit = 10, status } = {}) {
  const skip = (page - 1) * limit;
  const where = { userId, ...(status && { status }) };

  const [applications, total] = await Promise.all([
    prisma.opportunityApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        opportunity: {
          include: {
            charity: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    }),
    prisma.opportunityApplication.count({ where }),
  ]);

  return { applications, total, page, limit };
}

export async function applyToOpportunity(userId, opportunityId, { message } = {}) {
  const opportunity = await prisma.volunteeringOpportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) throw { status: 404, message: "Opportunity not found" };
  if (opportunity.status !== "OPEN") throw { status: 400, message: "This opportunity is not open for applications" };

  const existing = await prisma.opportunityApplication.findUnique({
    where: { userId_opportunityId: { userId, opportunityId } },
  });
  if (existing) throw { status: 409, message: "You have already applied to this opportunity" };

  return prisma.opportunityApplication.create({
    data: { userId, opportunityId, message: message || null },
    include: {
      opportunity: { select: { id: true, title: true } },
    },
  });
}

export async function withdrawApplication(userId, applicationId) {
  const application = await prisma.opportunityApplication.findFirst({
    where: { id: applicationId, userId },
  });

  if (!application) throw { status: 404, message: "Application not found" };
  if (application.status !== "PENDING") throw { status: 400, message: "Only pending applications can be withdrawn" };

  return prisma.opportunityApplication.delete({ where: { id: applicationId } });
}
