-- Migration: Add AlertDomain table and update Alert for Turso
-- Run via scripts/migrate-alertdomain-turso.ts

-- 1. Create AlertDomain table
CREATE TABLE IF NOT EXISTS "AlertDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "allowedRoles" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "AlertDomain_name_key" ON "AlertDomain"("name");

-- 3. Insert default domains
INSERT OR IGNORE INTO "AlertDomain" ("id", "name", "displayName", "description", "icon", "color", "allowedRoles", "sortOrder", "updatedAt")
VALUES 
  ('dom_operations', 'operations', 'Operaciones', 'Alertas técnicas: errores, DB, cuotas, seguridad', 'server', '#ef4444', '["ADMIN", "DEV"]', 1, CURRENT_TIMESTAMP),
  ('dom_business', 'business', 'Negocio', 'Alertas comerciales: leads, pagos, citas, quejas', 'briefcase', '#3b82f6', '["ADMIN", "SALES"]', 2, CURRENT_TIMESTAMP),
  ('dom_social', 'social', 'Social', 'Alertas sociales: menciones, sentimiento, tendencias', 'message-circle', '#10b981', '["ADMIN", "COMMUNITY"]', 3, CURRENT_TIMESTAMP);

-- 4. Add domainId column to Alert if not exists (will fail silently if exists)
ALTER TABLE "Alert" ADD COLUMN "domainId" TEXT DEFAULT 'dom_operations';

-- 5. Create index on domainId
CREATE INDEX IF NOT EXISTS "Alert_domainId_idx" ON "Alert"("domainId");

-- 6. Remove old domain column if exists (optional cleanup)
-- ALTER TABLE "Alert" DROP COLUMN "domain";
-- ALTER TABLE "Alert" DROP COLUMN "targetRoles";
