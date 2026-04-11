-- CreateTable: VolunteerExperience
CREATE TABLE "VolunteerExperience" (
  "id"          SERIAL       NOT NULL,
  "volunteerId" INTEGER      NOT NULL,
  "company"     TEXT         NOT NULL,
  "role"        TEXT         NOT NULL,
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3),
  "isCurrent"   BOOLEAN      NOT NULL DEFAULT false,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VolunteerExperience_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "VolunteerExperience"
  ADD CONSTRAINT "VolunteerExperience_volunteerId_fkey"
  FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "VolunteerExperience_volunteerId_idx" ON "VolunteerExperience"("volunteerId");
