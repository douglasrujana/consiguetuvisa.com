-- Crear tabla Customer (clientes externos)
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "emailVerified" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Crear tabla StaffMember (equipo interno)
CREATE TABLE IF NOT EXISTS "StaffMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "permissions" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "invitedBy" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agregar campo migratedTo a User
ALTER TABLE "User" ADD COLUMN "migratedTo" TEXT;

-- Crear índices para Customer
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_clerkId_key" ON "Customer"("clerkId");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");

-- Crear índices para StaffMember
CREATE UNIQUE INDEX IF NOT EXISTS "StaffMember_clerkId_key" ON "StaffMember"("clerkId");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffMember_email_key" ON "StaffMember"("email");

-- Agregar columnas a Alert
ALTER TABLE "Alert" ADD COLUMN "domain" TEXT DEFAULT 'operations';
ALTER TABLE "Alert" ADD COLUMN "targetRoles" TEXT;
ALTER TABLE "Alert" ADD COLUMN "channels" TEXT;
ALTER TABLE "Alert" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Alert" ADD COLUMN "acknowledgedById" TEXT;

-- Crear índice para domain en Alert
CREATE INDEX IF NOT EXISTS "Alert_domain_idx" ON "Alert"("domain");

-- Agregar customerId a Conversation
ALTER TABLE "Conversation" ADD COLUMN "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "Conversation_customerId_idx" ON "Conversation"("customerId");
