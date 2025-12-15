-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT,
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
INSERT INTO "new_StaffMember" ("clerkId", "createdAt", "department", "email", "firstName", "id", "invitedBy", "isActive", "lastName", "permissions", "role", "updatedAt") SELECT "clerkId", "createdAt", "department", "email", "firstName", "id", "invitedBy", "isActive", "lastName", "permissions", "role", "updatedAt" FROM "StaffMember";
DROP TABLE "StaffMember";
ALTER TABLE "new_StaffMember" RENAME TO "StaffMember";
CREATE UNIQUE INDEX "StaffMember_clerkId_key" ON "StaffMember"("clerkId");
CREATE UNIQUE INDEX "StaffMember_email_key" ON "StaffMember"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
