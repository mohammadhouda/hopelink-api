import prisma from "../../config/prisma.js";

export async function createOpportunity(charityId, data) {
  const { title, description, startDate, endDate, location, maxSlots, projectId, requiredSkills, availabilityDays } = data;

  if (projectId) {
    const project = await prisma.charityProject.findFirst({
      where: { id: projectId, charityId },
    });
    if (!project) throw { status: 404, message: "Project not found" };
  }

  return prisma.volunteeringOpportunity.create({
    data: {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      maxSlots: maxSlots ?? 10,
      charityId,
      projectId: projectId ?? null,
      requiredSkills: requiredSkills ?? [],
      availabilityDays: availabilityDays ?? [],
    },
  });
}

export async function getOpportunities(charityId, { page = 1, limit = 10, status, projectId } = {}) {
  const skip = (page - 1) * limit;
  const where = { charityId };
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  const [opportunities, total] = await Promise.all([
    prisma.volunteeringOpportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        _count: { select: { applications: { where: { status: "APPROVED" } } } },
      },
    }),
    prisma.volunteeringOpportunity.count({ where }),
  ]);

  return { opportunities, total, page, limit };
}

export async function getOpportunityById(charityId, opportunityId) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
    include: {
      project: { select: { id: true, title: true } },
      _count: { select: { applications: { where: { status: "APPROVED" } } } },
      room: { select: { id: true, status: true } },
    },
  });

  if (!opportunity) throw { status: 404, message: "Opportunity not found" };
  return opportunity;
}

export async function updateOpportunity(charityId, opportunityId, data) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  const { title, description, startDate, endDate, location, maxSlots, status, requiredSkills, availabilityDays } = data;

  return prisma.volunteeringOpportunity.update({
    where: { id: opportunityId },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(location !== undefined && { location }),
      ...(maxSlots && { maxSlots }),
      ...(status && { status }),
      ...(requiredSkills !== undefined && { requiredSkills }),
      ...(availabilityDays !== undefined && { availabilityDays }),
    },
  });
}

export async function deleteOpportunity(charityId, opportunityId) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };

  return prisma.volunteeringOpportunity.delete({ where: { id: opportunityId } });
}

export async function endOpportunity(charityId, opportunityId) {
  const opportunity = await prisma.volunteeringOpportunity.findFirst({
    where: { id: opportunityId, charityId },
  });
  if (!opportunity) throw { status: 404, message: "Opportunity not found" };
  if (opportunity.status === "ENDED") throw { status: 400, message: "Opportunity already ended" };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.volunteeringOpportunity.update({
      where: { id: opportunityId },
      data: { status: "ENDED" },
    });

    // Close the room if it exists
    await tx.volunteerRoom.updateMany({
      where: { opportunityId, status: "ACTIVE" },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    return updated;
  });
}
