import prisma from "../../config/prisma.js";
import notificationEmitter, { NOTIFY_USER } from "../../events/notificationEmitter.js";

export async function issueCertificate(charityId, { volunteerId, opportunityId }) {
  // Ensure opportunity belongs to charity and has ended
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
    include: { charity: { select: { name: true } } },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };
  if (opportunity.status !== "ENDED") {
    throw { status: 400, message: "Certificates can only be issued after the opportunity has ended" };
  }

  // Ensure volunteer was approved
  const application = await prisma.opportunityApplication.findFirst({
    where: { userId: volunteerId, opportunityId, status: "APPROVED" },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!application) {
    throw { status: 400, message: "This volunteer did not participate in this opportunity" };
  }

  // Build certificate data
  const certificateData = {
    volunteerName: application.user.name,
    charityName: opportunity.charity.name,
    opportunityTitle: opportunity.title,
    startDate: opportunity.startDate,
    endDate: opportunity.endDate,
    issuedAt: new Date(),
  };

  const certificate = await prisma.certificate.upsert({
    where: { volunteerId_opportunityId: { volunteerId, opportunityId } },
    create: { volunteerId, opportunityId, charityId, certificateData },
    update: { certificateData, issuedAt: new Date() },
  });

  // Notify volunteer
  notificationEmitter.emit(NOTIFY_USER, {
    userId: volunteerId,
    title: "Certificate Issued!",
    message: `You have been issued a certificate for completing "${opportunity.title}" with ${opportunity.charity.name}.`,
    type: "SUCCESS",
    link: `/user/certificates`,
  });

  return certificate;
}

export async function bulkIssueCertificates(charityId, opportunityId) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
    include: { charity: { select: { name: true } } },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };
  if (opportunity.status !== "ENDED") {
    throw { status: 400, message: "Certificates can only be issued after the opportunity has ended" };
  }

  // Get all approved volunteers
  const approvedApplications = await prisma.opportunityApplication.findMany({
    where: { opportunityId, status: "APPROVED" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (approvedApplications.length === 0) {
    throw { status: 400, message: "No approved volunteers for this opportunity" };
  }

  const certificateData = {
    charityName: opportunity.charity.name,
    opportunityTitle: opportunity.title,
    startDate: opportunity.startDate,
    endDate: opportunity.endDate,
    issuedAt: new Date(),
  };

  const results = await prisma.$transaction(
    approvedApplications.map((app) =>
      prisma.certificate.upsert({
        where: { volunteerId_opportunityId: { volunteerId: app.userId, opportunityId } },
        create: {
          volunteerId: app.userId,
          opportunityId,
          charityId,
          certificateData: { ...certificateData, volunteerName: app.user.name },
        },
        update: {
          certificateData: { ...certificateData, volunteerName: app.user.name },
          issuedAt: new Date(),
        },
      })
    )
  );

  // Notify all volunteers
  approvedApplications.forEach((app) =>
    notificationEmitter.emit(NOTIFY_USER, {
      userId: app.userId,
      title: "Certificate Issued!",
      message: `You have been issued a certificate for completing "${opportunity.title}".`,
      type: "SUCCESS",
      link: `/user/certificates`,
    })
  );

  return { issued: results.length, certificates: results };
}

export async function getCertificatesIssued(charityId, { page = 1, limit = 10, opportunityId } = {}) {
  const skip = (page - 1) * limit;
  const where = { charityId, ...(opportunityId && { opportunityId }) };

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issuedAt: "desc" },
      include: {
        volunteer: { select: { id: true, name: true, email: true } },
        opportunity: { select: { id: true, title: true } },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return { certificates, total, page, limit };
}
