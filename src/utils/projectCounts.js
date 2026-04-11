import prisma from "../config/prisma.js";

/**
 * Returns a map of { [projectId]: applicationCount } for the given project IDs.
 * Counts across two hops: CharityProject → VolunteeringOpportunity → OpportunityApplication.
 */
export async function getApplicationCountsByProject(projectIds) {
  if (!projectIds || projectIds.length === 0) return {};

  const placeholders = projectIds.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await prisma.$queryRawUnsafe(
    `SELECT p.id, COUNT(a.id)::int AS "applicationCount"
     FROM "CharityProject" p
     LEFT JOIN "VolunteeringOpportunity" o ON o."projectId" = p.id
     LEFT JOIN "OpportunityApplication" a ON a."opportunityId" = o.id
     WHERE p.id IN (${placeholders})
     GROUP BY p.id`,
    ...projectIds
  );

  return Object.fromEntries(rows.map((r) => [r.id, r.applicationCount ?? 0]));
}
