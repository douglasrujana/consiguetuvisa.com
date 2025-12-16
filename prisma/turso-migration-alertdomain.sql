-- Migration: Add AlertDomain table and update Alert
-- Run this in Turso production

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

CREATE UNIQUE INDEX IF NOT EXISTS "AlertDomain_name_key" ON "AlertDomain"("name");

-- 2. Insert default domains
INSERT OR IGNORE INTO "AlertDomain" ("id", "name", "displayName", "description", "icon", "color", "allowedRoles", "sortOrder")
VALUES 
  ('dom_operations', 'operations', 'Operaciones', 'Alertas técnicas: errores, DB, cuotas, seguridad', 'server', '#ef4444', '["ADMIN", "DEV"]', 1),
  ('dom_business', 'business', 'Negocio', 'Alertas comerciales: leads, pagos, citas, quejas', 'briefcase', '#3b82f6', '["ADMIN", "SALES"]', 2),
  ('dom_social', 'social', 'Social', 'Alertas sociales: menciones, sentimiento, tendencias', 'message-circle', '#10b981', '["ADMIN", "COMMUNITY"]', 3);

-- 3. Add domainId column to Alert (if not exists)
-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check first
-- This will fail silently if column exists

-- 4. Update existing alerts to use operations domain
UPDATE "Alert" SET "domainId" = 'dom_operations' WHERE "domainId" IS NULL OR "domainId" = '';
