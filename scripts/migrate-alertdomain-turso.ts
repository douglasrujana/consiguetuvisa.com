// scripts/migrate-alertdomain-turso.ts
// Migrar AlertDomain a Turso producción

import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

config({ path: '.env.local', override: true });
config({ path: '.env.production', override: true });

// Usar TURSO_DATABASE_URL o DATABASE_URL
const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';

function parseConnectionString(connStr: string): { url: string; authToken?: string } {
  if (connStr.includes('?authToken=')) {
    const idx = connStr.indexOf('?authToken=');
    return { url: connStr.substring(0, idx), authToken: connStr.substring(idx + 11) };
  }
  return { url: connStr, authToken: process.env.TURSO_AUTH_TOKEN };
}

async function main() {
  const { url, authToken } = parseConnectionString(TURSO_URL);
  
  if (!url.includes('turso.io')) {
    console.log('⚠️  DATABASE_URL no es Turso. Usa TURSO_DATABASE_URL o configura .env.production');
    console.log('   URL actual:', url.substring(0, 30) + '...');
    return;
  }

  const client = createClient({ url, authToken });
  console.log('🚀 Migrando AlertDomain a Turso...\n');

  const statements = [
    // 1. Crear tabla AlertDomain
    `CREATE TABLE IF NOT EXISTS "AlertDomain" (
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
    )`,
    // 2. Índice único
    `CREATE UNIQUE INDEX IF NOT EXISTS "AlertDomain_name_key" ON "AlertDomain"("name")`,
    // 3. Insertar dominios
    `INSERT OR IGNORE INTO "AlertDomain" ("id", "name", "displayName", "description", "icon", "color", "allowedRoles", "sortOrder", "updatedAt") VALUES ('dom_operations', 'operations', 'Operaciones', 'Alertas técnicas', 'server', '#ef4444', '["ADMIN", "DEV"]', 1, CURRENT_TIMESTAMP)`,
    `INSERT OR IGNORE INTO "AlertDomain" ("id", "name", "displayName", "description", "icon", "color", "allowedRoles", "sortOrder", "updatedAt") VALUES ('dom_business', 'business', 'Negocio', 'Alertas comerciales', 'briefcase', '#3b82f6', '["ADMIN", "SALES"]', 2, CURRENT_TIMESTAMP)`,
    `INSERT OR IGNORE INTO "AlertDomain" ("id", "name", "displayName", "description", "icon", "color", "allowedRoles", "sortOrder", "updatedAt") VALUES ('dom_social', 'social', 'Social', 'Alertas sociales', 'message-circle', '#10b981', '["ADMIN", "COMMUNITY"]', 3, CURRENT_TIMESTAMP)`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log('✅', stmt.substring(0, 40).replace(/\n/g, ' ') + '...');
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log('⏭️  Ya existe');
      } else {
        console.log('⚠️ ', msg.substring(0, 60));
      }
    }
  }

  // Verificar dominios
  const domains = await client.execute('SELECT * FROM AlertDomain');
  console.log(`\n📊 Dominios: ${domains.rows.length}`);
  domains.rows.forEach(r => console.log(`   - ${r.name}: ${r.displayName}`));

  // Agregar columna domainId a Alert
  await addDomainIdToAlert(client);

  client.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);


// Agregar columna domainId a Alert si no existe
async function addDomainIdToAlert(client: any) {
  console.log('\n🔧 Verificando columna domainId en Alert...');
  
  try {
    // Verificar si la columna existe
    const tableInfo = await client.execute("PRAGMA table_info(Alert)");
    const hasDomainId = tableInfo.rows.some((r: any) => r.name === 'domainId');
    
    if (hasDomainId) {
      console.log('✅ Columna domainId ya existe');
    } else {
      await client.execute(`ALTER TABLE "Alert" ADD COLUMN "domainId" TEXT DEFAULT 'dom_operations'`);
      console.log('✅ Columna domainId agregada');
    }
    
    // Crear índice
    try {
      await client.execute(`CREATE INDEX IF NOT EXISTS "Alert_domainId_idx" ON "Alert"("domainId")`);
      console.log('✅ Índice Alert_domainId_idx creado');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  Índice ya existe');
      }
    }
  } catch (e: any) {
    console.log('⚠️  Error:', e.message?.substring(0, 60));
  }
}
