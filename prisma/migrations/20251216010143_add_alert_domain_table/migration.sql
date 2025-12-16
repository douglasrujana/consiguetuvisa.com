/*
  Warnings:

  - You are about to drop the column `domain` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `targetRoles` on the `Alert` table. All the data in the column will be lost.
  - Added the required column `domainId` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "AlertDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "allowedRoles" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
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
    "domainId" TEXT NOT NULL,
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
    CONSTRAINT "Alert_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "AlertDomain" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alert_mentionId_fkey" FOREIGN KEY ("mentionId") REFERENCES "SocialMention" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "StaffMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("acknowledgedAt", "acknowledgedById", "channels", "content", "context", "createdAt", "createdById", "id", "mentionId", "priority", "sourceId", "title", "type") SELECT "acknowledgedAt", "acknowledgedById", "channels", "content", "context", "createdAt", "createdById", "id", "mentionId", "priority", "sourceId", "title", "type" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_type_idx" ON "Alert"("type");
CREATE INDEX "Alert_priority_idx" ON "Alert"("priority");
CREATE INDEX "Alert_domainId_idx" ON "Alert"("domainId");
CREATE INDEX "Alert_acknowledgedAt_idx" ON "Alert"("acknowledgedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AlertDomain_name_key" ON "AlertDomain"("name");
