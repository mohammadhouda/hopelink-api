import prisma from "../../config/prisma.js";
import { getApplicationCountsByProject } from "../../utils/projectCounts.js";

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
    }),
    prisma.charityProject.count({ where }),
  ]);

  const countMap = await getApplicationCountsByProject(projects.map((p) => p.id));
  const projectsWithCounts = projects.map((p) => ({
    ...p,
    _count: { applications: countMap[p.id] ?? 0 },
  }));

  return { projects: projectsWithCounts, total, page, limit };
}

export async function getProjectById(charityId, projectId) {
  const project = await prisma.charityProject.findFirst({
    where: { id: projectId, charityId },
    include: {
      opportunities: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { applications: true } },
        },
      },
    },
  });

  if (!project) throw { status: 404, message: "Project not found" };

  const totalApplications = project.opportunities.reduce(
    (sum, o) => sum + (o._count?.applications ?? 0),
    0
  );
  project._count = {
    opportunities: project.opportunities.length,
    applications: totalApplications,
  };

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
