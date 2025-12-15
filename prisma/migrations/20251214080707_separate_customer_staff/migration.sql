/*
  Warnings:

  - You are about to drop the column `acknowledgedBy` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `changedBy` on the `StatusHistory` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `Solicitud` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "migratedTo" TEXT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'operations',
    "targetRoles" TEXT,
    "channels" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "sourceId" TEXT,
    "mentionId" TEXT,
    "createdById" TEXT,
    "acknowledgedAt" DATETIME,
    "acknowledgedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_mentionId_fkey" FOREIGN KEY ("mentionId") REFERENCES "SocialMention" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("acknowledgedAt", "content", "context", "createdAt", "id", "mentionId", "priority", "sourceId", "title", "type") SELECT "acknowledgedAt", "content", "context", "createdAt", "id", "mentionId", "priority", "sourceId", "title", "type" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_type_idx" ON "Alert"("type");
CREATE INDEX "Alert_priority_idx" ON "Alert"("priority");
CREATE INDEX "Alert_domain_idx" ON "Alert"("domain");
CREATE INDEX "Alert_acknowledgedAt_idx" ON "Alert"("acknowledgedAt");
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("createdAt", "id", "notes", "scheduledDate", "serviceType", "status", "updatedAt") SELECT "createdAt", "id", "notes", "scheduledDate", "serviceType", "status", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("createdAt", "id", "title", "updatedAt") SELECT "createdAt", "id", "title", "updatedAt" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE INDEX "Conversation_customerId_idx" ON "Conversation"("customerId");
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitudId" TEXT,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("createdAt", "fileName", "fileSize", "fileUrl", "id", "mimeType", "name", "reviewNotes", "reviewedAt", "solicitudId", "status", "type", "updatedAt") SELECT "createdAt", "fileName", "fileSize", "fileUrl", "id", "mimeType", "name", "reviewNotes", "reviewedAt", "solicitudId", "status", "type", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitudId" TEXT,
    "customerId" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("content", "createdAt", "createdById", "id", "isInternal", "solicitudId", "type") SELECT "content", "createdAt", "createdById", "id", "isInternal", "solicitudId", "type" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE TABLE "new_Solicitud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NUEVA',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "fullName" TEXT NOT NULL,
    "birthDate" DATETIME,
    "nationality" TEXT,
    "passportNumber" TEXT,
    "passportExpiry" DATETIME,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT,
    "travelPurpose" TEXT,
    "travelDate" DATETIME,
    "returnDate" DATETIME,
    "hasVisaHistory" BOOLEAN NOT NULL DEFAULT false,
    "visaHistoryNotes" TEXT,
    "hasDenials" BOOLEAN NOT NULL DEFAULT false,
    "denialNotes" TEXT,
    "bitrixLeadId" TEXT,
    "bitrixDealId" TEXT,
    "appointmentDate" DATETIME,
    "interviewDate" DATETIME,
    "source" TEXT,
    "assignedAgentId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Solicitud_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Solicitud_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Solicitud" ("appointmentDate", "assignedAgentId", "birthDate", "bitrixDealId", "bitrixLeadId", "city", "createdAt", "currentStep", "denialNotes", "destinationCountry", "email", "fullName", "hasDenials", "hasVisaHistory", "id", "interviewDate", "nationality", "passportExpiry", "passportNumber", "phone", "priority", "returnDate", "source", "status", "totalSteps", "travelDate", "travelPurpose", "updatedAt", "visaHistoryNotes", "visaType") SELECT "appointmentDate", "assignedAgentId", "birthDate", "bitrixDealId", "bitrixLeadId", "city", "createdAt", "currentStep", "denialNotes", "destinationCountry", "email", "fullName", "hasDenials", "hasVisaHistory", "id", "interviewDate", "nationality", "passportExpiry", "passportNumber", "phone", "priority", "returnDate", "source", "status", "totalSteps", "travelDate", "travelPurpose", "updatedAt", "visaHistoryNotes", "visaType" FROM "Solicitud";
DROP TABLE "Solicitud";
ALTER TABLE "new_Solicitud" RENAME TO "Solicitud";
CREATE TABLE "new_StatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitudId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusHistory_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StatusHistory" ("createdAt", "fromStatus", "id", "reason", "solicitudId", "toStatus") SELECT "createdAt", "fromStatus", "id", "reason", "solicitudId", "toStatus" FROM "StatusHistory";
DROP TABLE "StatusHistory";
ALTER TABLE "new_StatusHistory" RENAME TO "StatusHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_clerkId_key" ON "Customer"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_clerkId_key" ON "StaffMember"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_email_key" ON "StaffMember"("email");
