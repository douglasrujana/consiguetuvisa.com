// scripts/migrate-alertdomain-turso.ts
// Migrar AlertDomain a Turso producción

import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

config({ path: '.env.local', override: true });

const TURSO_URL = process.env.DATABASE_URL || '';

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
    console.log('⚠️  No es Turso, saltando...');
    return;
  }

  const client = createClient({ url, authToken });
  console.log('🚀 Migrando AlertDomain a Turso...\n');

  const sql = readFileSync('prisma/turso-migration-alertdomain.sql', 'utf-8');
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log('✅', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        console.log('⏭️  Ya existe:', stmt.substring(0, 40) + '...');
      } else {
        console.error('❌', e.message);
      }
    }
  }

  // Verify
  const domains = await client.execute('SELECT * FROM AlertDomain');
  console.log(`\n📊 Dominios: ${domains.rows.length}`);
  domains.rows.forEach(r => console.log(`   - ${r.name}: ${r.displayName}`));

  client.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);
