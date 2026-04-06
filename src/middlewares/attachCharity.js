import prisma from "../config/prisma.js";
import { failure } from "../utils/response.js";

// Attaches req.charityId from the authenticated charity user
export default async function attachCharity(req, res, next) {
  try {
    const charity = await prisma.charityAccount.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    if (!charity) return failure(res, "Charity account not found", 404);

    req.charityId = charity.id;
    next();
  } catch {
    return failure(res, "Failed to resolve charity account", 500);
  }
}
