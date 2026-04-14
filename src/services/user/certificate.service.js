import prisma from "../../config/prisma.js";

export async function getMyCertificates(userId, { skip, take, page, limit } = {}) {

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where: { volunteerId: userId },
      skip,
      take,
      orderBy: { issuedAt: "desc" },
      include: {
        opportunity: { select: { id: true, title: true, startDate: true, endDate: true } },
        charity: { select: { id: true, name: true, logoUrl: true } },
      },
    }),
    prisma.certificate.count({ where: { volunteerId: userId } }),
  ]);

  return { certificates, total, page, limit };
}

export async function getCertificateById(userId, certificateId) {
  const certificate = await prisma.certificate.findFirst({
    where: { id: certificateId, volunteerId: userId },
    include: {
      opportunity: { select: { id: true, title: true, startDate: true, endDate: true, location: true } },
      charity: { select: { id: true, name: true, logoUrl: true, city: true } },
      volunteer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!certificate) throw { status: 404, message: "Certificate not found" };
  return certificate;
}
