import { Worker } from "bullmq";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { redisOptions } from "../config/redis.js";
import { scoreOpportunity } from "./scoreOpportunity.js";

const BATCH_SIZE = 500;

const OPPORTUNITY_SELECT = {
  id: true,
  title: true,
  description: true,
  requiredSkills: true,
  availabilityDays: true,
  startDate: true,
  location: true,
  status: true,
  charity: { select: { category: true } },
};

// ── Bulk upsert helper ────────────────────────────────────────────────────────
async function upsertScores(rows) {
  if (rows.length === 0) {
    console.log("[upsertScores] no rows to upsert, skipping");
    return;
  }

  console.log(`[upsertScores] upserting ${rows.length} score rows`);

  // Prisma.join builds a comma-separated list of Sql fragments
  const tuples = rows.map(
    (r) => Prisma.sql`(${r.volunteerId}, ${r.opportunityId}, ${r.score}, NOW())`
  );

  await prisma.$executeRaw`
    INSERT INTO "VolunteerMatchScore" ("volunteerId", "opportunityId", score, "computedAt")
    VALUES ${Prisma.join(tuples)}
    ON CONFLICT ("volunteerId", "opportunityId")
    DO UPDATE SET score = EXCLUDED.score, "computedAt" = NOW()
  `;

  console.log(`[upsertScores] done`);
}

// ── score:volunteer ────────────────────────────────────────────────────────────
async function handleScoreVolunteer({ volunteerId }) {
  console.log(`[score:volunteer] START — volunteerId=${volunteerId}`);

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: volunteerId },
    include: { skills: true, preferences: true },
  });

  if (!profile) {
    console.log(`[score:volunteer] no volunteer profile found for userId=${volunteerId}, skipping`);
    return;
  }

  const volunteerSkills = profile.skills.map((s) => s.skill);
  const volunteerDays   = profile.availabilityDays ?? [];
  const preferences     = profile.preferences ?? [];

  console.log(
    `[score:volunteer] profile — skills: [${volunteerSkills}], days: [${volunteerDays}], prefs: ${preferences.length}`
  );

  if (volunteerSkills.length === 0 && volunteerDays.length === 0 && preferences.length === 0) {
    console.log(`[score:volunteer] empty profile — clearing scores for volunteerId=${volunteerId}`);
    await prisma.volunteerMatchScore.deleteMany({ where: { volunteerId } });
    return;
  }

  const allOpenIds = new Set();
  let cursor = 0;
  let batchNum = 0;

  while (true) {
    const batch = await prisma.volunteeringOpportunity.findMany({
      where: { status: "OPEN" },
      select: OPPORTUNITY_SELECT,
      skip: cursor,
      take: BATCH_SIZE,
      orderBy: { id: "asc" },
    });

    batchNum++;
    console.log(`[score:volunteer] batch ${batchNum} — fetched ${batch.length} OPEN opportunities`);

    if (batch.length === 0) break;

    batch.forEach((o) => allOpenIds.add(o.id));

    const rows = batch.map((opp) => ({
      volunteerId,
      opportunityId: opp.id,
      score: scoreOpportunity(opp, volunteerSkills, volunteerDays, preferences),
    }));

    const nonZero = rows.filter((r) => r.score > 0).length;
    console.log(`[score:volunteer] batch ${batchNum} scored — ${nonZero}/${rows.length} with score > 0`);

    await upsertScores(rows);
    cursor += BATCH_SIZE;

    if (batch.length < BATCH_SIZE) break;
  }

  // Delete scores for opportunities no longer OPEN
  const deleted = await prisma.volunteerMatchScore.deleteMany({
    where: { volunteerId, opportunityId: { notIn: [...allOpenIds] } },
  });

  console.log(
    `[score:volunteer] DONE — scored ${allOpenIds.size} opportunities, deleted ${deleted.count} stale rows`
  );
}

// ── score:opportunity ─────────────────────────────────────────────────────────
async function handleScoreOpportunity({ opportunityId }) {
  console.log(`[score:opportunity] START — opportunityId=${opportunityId}`);

  const opp = await prisma.volunteeringOpportunity.findUnique({
    where: { id: opportunityId },
    select: OPPORTUNITY_SELECT,
  });

  if (!opp) {
    console.log(`[score:opportunity] opportunity ${opportunityId} not found, skipping`);
    return;
  }
  if (opp.status !== "OPEN") {
    console.log(`[score:opportunity] opportunity ${opportunityId} status=${opp.status}, skipping`);
    return;
  }

  let cursor = 0;
  let batchNum = 0;
  let totalScored = 0;

  while (true) {
    const profiles = await prisma.volunteerProfile.findMany({
      where: {
        OR: [
          { skills: { some: {} } },
          { availabilityDays: { isEmpty: false } },
          { preferences: { some: {} } },
        ],
      },
      include: { skills: true, preferences: true },
      skip: cursor,
      take: BATCH_SIZE,
      orderBy: { id: "asc" },
    });

    batchNum++;
    console.log(`[score:opportunity] batch ${batchNum} — ${profiles.length} volunteer profiles`);

    if (profiles.length === 0) break;

    const rows = profiles.map((p) => ({
      volunteerId:   p.userId,
      opportunityId: opp.id,
      score: scoreOpportunity(
        opp,
        p.skills.map((s) => s.skill),
        p.availabilityDays ?? [],
        p.preferences ?? [],
      ),
    }));

    await upsertScores(rows);
    totalScored += rows.length;
    cursor += BATCH_SIZE;

    if (profiles.length < BATCH_SIZE) break;
  }

  console.log(`[score:opportunity] DONE — scored against ${totalScored} volunteers`);
}

// ── Worker ────────────────────────────────────────────────────────────────────
export const matchScoreWorker = new Worker(
  "match-scores",
  async (job) => {
    console.log(`[MatchScoreWorker] received job name=${job.name} id=${job.id} data=${JSON.stringify(job.data)}`);
    if (job.name === "score:volunteer")   return handleScoreVolunteer(job.data);
    if (job.name === "score:opportunity") return handleScoreOpportunity(job.data);
    console.warn(`[MatchScoreWorker] unknown job name: ${job.name}`);
  },
  { connection: redisOptions, concurrency: 5 },
);

matchScoreWorker.on("completed", (job) =>
  console.log(`[MatchScoreWorker] ✓ completed job name=${job.name} id=${job.id}`)
);

matchScoreWorker.on("failed", (job, err) =>
  console.error(`[MatchScoreWorker] ✗ failed job name=${job?.name} id=${job?.id} — ${err.message}`, err.stack)
);

matchScoreWorker.on("error", (err) =>
  console.error("[MatchScoreWorker] worker error:", err.message)
);

console.log("[MatchScoreWorker] worker registered and listening");
