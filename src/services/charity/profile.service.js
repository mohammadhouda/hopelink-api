import prisma from "../../config/prisma.js";

export async function getProfile(userId) {
  const charity = await prisma.charityAccount.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      _count: {
        select: {
          charityProjects: true,
          opportunities: true,
          ratingsGiven: true,
          issuedCerts: true,
        },
      },
    },
  });

  if (!charity) throw { status: 404, message: "Charity profile not found" };
  return charity;
}

export async function updateProfile(userId, data) {
  const charity = await prisma.charityAccount.findUnique({ where: { userId } });
  if (!charity) throw { status: 404, message: "Charity profile not found" };

  const { name, description, logoUrl, websiteUrl, phone, address, city, category } = data;

  return prisma.charityAccount.update({
    where: { userId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(websiteUrl !== undefined && { websiteUrl }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(category && { category }),
    },
  });
}
