/**
 * One-time backfill script.
 * Enqueues a score:volunteer job for every volunteer who has at least one
 * skill, availability day, or preference set.
 *
 * Usage:
 *   node --experimental-vm-modules src/jobs/backfillScores.js
 *   (or add "backfill": "node src/jobs/backfillScores.js" to package.json scripts)
 */

import dotenv from "dotenv";
dotenv.config();

import prisma from "../config/prisma.js";
import { matchScoreQueue } from "./matchScoreQueue.js";

async function backfill() {
  console.log("[Backfill] finding volunteers with profiles...");

  const profiles = await prisma.volunteerProfile.findMany({
    where: {
      OR: [
        { skills: { some: {} } },
        { availabilityDays: { isEmpty: false } },
        { preferences: { some: {} } },
      ],
    },
    select: { userId: true },
  });

  console.log(`[Backfill] enqueueing score:volunteer for ${profiles.length} volunteers`);

  for (const { userId } of profiles) {
    await matchScoreQueue.add(
      "score:volunteer",
      { volunteerId: userId },
      { jobId: `backfill-volunteer-${userId}` },
    );
  }

  console.log("[Backfill] done — jobs are queued, worker will process them shortly");
  await prisma.$disconnect();
  process.exit(0);
}

backfill().catch((err) => {
  console.error("[Backfill] error:", err);
  process.exit(1);
});
