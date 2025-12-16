// scripts/check-turso-data.ts
import { config } from 'dotenv';
import { createClient } from '@libsql/client';

config({ path: '.env.local', override: true });
config({ path: '.env.production', override: true });

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
    console.log('⚠️  No es Turso');
    return;
  }

  const client = createClient({ url, authToken });
  console.log('🔍 Verificando datos en Turso...\n');

  // Verificar tablas
  const tables = ['AlertDomain', 'Alert', 'Source', 'KBDocument', 'Chunk', 'Customer', 'Conversation'];
  
  for (const table of tables) {
    try {
      const result = await client.execute(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`📊 ${table}: ${result.rows[0].count} registros`);
    } catch (e: any) {
      console.log(`❌ ${table}: ${e.message?.substring(0, 40)}`);
    }
  }

  client.close();
}

main().catch(console.error);
