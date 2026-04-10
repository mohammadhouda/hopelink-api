ALTER TABLE "VolunteeringOpportunity"
  ADD COLUMN IF NOT EXISTS "requiredSkills"   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "availabilityDays" TEXT[] NOT NULL DEFAULT '{}';
