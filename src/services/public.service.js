import prisma from "../config/prisma.js";

export async function getPlatformStats() {
  const [volunteers, charities, opportunities] = await Promise.all([
    prisma.user.count({ where: { role: "USER", isActive: true } }),
    prisma.charityAccount.count({ where: { user: { isActive: true } } }),
    prisma.volunteeringOpportunity.count({ where: { status: "OPEN" } }),
  ]);
  return { volunteers, charities, opportunities };
}
