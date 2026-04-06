import prisma from "../../config/prisma.js";

export async function createProject(charityId, data) {
  const { title, description, category } = data;

  return prisma.charityProject.create({
    data: { title, description, category, charityId },
  });
}

export async function getProjects(charityId, { page = 1, limit = 10, status } = {}) {
  const skip = (page - 1) * limit;
  const where = { charityId, ...(status && { status }) };

  const [projects, total] = await Promise.all([
    prisma.charityProject.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { opportunities: true, applications: true } },
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
        include: { _count: { select: { applications: true } } },
      },
      _count: { select: { applications: true } },
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
