-- Replace availabilityNote (text) with availabilityDays (text[])
ALTER TABLE "VolunteerProfile" DROP COLUMN IF EXISTS "availabilityNote";
ALTER TABLE "VolunteerProfile" ADD COLUMN IF NOT EXISTS "availabilityDays" TEXT[] NOT NULL DEFAULT '{}';
