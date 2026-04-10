import prisma from "../../config/prisma.js";

export async function createProject(charityId, data) {
  const { title, description, category, startDate, endDate } = data;

  let start_date = new Date(startDate);
  let end_date = new Date(endDate);

  return prisma.charityProject.create({
    data: {
      title,
      description,
      category,
      startDate: start_date,
      endDate: end_date,
      charityId,
    },
  });
}

export async function getProjects(
  charityId,
  { page = 1, limit = 10, status, startFrom, startTo } = {},
) {
  const skip = (page - 1) * limit;

  const startDateFilter = {};
  if (startFrom) startDateFilter.gte = new Date(startFrom);
  if (startTo) startDateFilter.lte = new Date(startTo);

  const where = {
    charityId,
    ...(status && { status }),
    ...(Object.keys(startDateFilter).length && { startDate: startDateFilter }),
  };

  const [projects, total] = await Promise.all([
    prisma.charityProject.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { opportunities: true } },
      },
    }),
    prisma.charityProject.count({ where }),
  ]);

  return { projects, total, page, limit };
}

export async function getProjectById(charityId, projectId) {
  const project = await prisma.charityProject.findFirst({
    where: { id: projectId, charityId },
    include: {
      opportunities: {
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { opportunities: true } },
    },
  });

  if (!project) throw { status: 404, message: "Project not found" };
  return project;
}

export async function updateProject(charityId, projectId, data) {
  const project = await prisma.charityProject.findFirst({
    where: { id: projectId, charityId },
  });
  if (!project) throw { status: 404, message: "Project not found" };

  const { title, description, category, status } = data;

  return prisma.charityProject.update({
    where: { id: projectId },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(status && { status }),
    },
  });
}

export async function deleteProject(charityId, projectId) {
  const project = await prisma.charityProject.findFirst({
    where: { id: projectId, charityId },
  });
  if (!project) throw { status: 404, message: "Project not found" };

  return prisma.charityProject.delete({ where: { id: projectId } });
}
