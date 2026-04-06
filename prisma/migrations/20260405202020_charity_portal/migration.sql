/*
  Warnings:

  - Added the required column `updatedAt` to the `CharityProject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'FULL', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RoomRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "CharityProject" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "VolunteeringOpportunity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "maxSlots" INTEGER NOT NULL DEFAULT 10,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "charityId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteeringOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityApplication" (
    "id" SERIAL NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerRating" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "charityId" INTEGER NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" SERIAL NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "charityId" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateData" JSONB,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerRoom" (
    "id" SERIAL NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "VolunteerRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMessage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "RoomRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolunteeringOpportunity_charityId_idx" ON "VolunteeringOpportunity"("charityId");

-- CreateIndex
CREATE INDEX "VolunteeringOpportunity_status_idx" ON "VolunteeringOpportunity"("status");

-- CreateIndex
CREATE INDEX "VolunteeringOpportunity_startDate_idx" ON "VolunteeringOpportunity"("startDate");

-- CreateIndex
CREATE INDEX "OpportunityApplication_opportunityId_idx" ON "OpportunityApplication"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityApplication_status_idx" ON "OpportunityApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityApplication_userId_opportunityId_key" ON "OpportunityApplication"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "VolunteerRating_volunteerId_idx" ON "VolunteerRating"("volunteerId");

-- CreateIndex
CREATE INDEX "VolunteerRating_opportunityId_idx" ON "VolunteerRating"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerRating_charityId_volunteerId_opportunityId_key" ON "VolunteerRating"("charityId", "volunteerId", "opportunityId");

-- CreateIndex
CREATE INDEX "Certificate_volunteerId_idx" ON "Certificate"("volunteerId");

-- CreateIndex
CREATE INDEX "Certificate_opportunityId_idx" ON "Certificate"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_volunteerId_opportunityId_key" ON "Certificate"("volunteerId", "opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerRoom_opportunityId_key" ON "VolunteerRoom"("opportunityId");

-- CreateIndex
CREATE INDEX "RoomMessage_roomId_createdAt_idx" ON "RoomMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_idx" ON "RoomMember"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "VolunteeringOpportunity" ADD CONSTRAINT "VolunteeringOpportunity_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "CharityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteeringOpportunity" ADD CONSTRAINT "VolunteeringOpportunity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CharityProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteeringOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRating" ADD CONSTRAINT "VolunteerRating_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "CharityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRating" ADD CONSTRAINT "VolunteerRating_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRating" ADD CONSTRAINT "VolunteerRating_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteeringOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteeringOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "CharityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRoom" ADD CONSTRAINT "VolunteerRoom_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteeringOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VolunteerRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VolunteerRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
