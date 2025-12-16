// scripts/check-banners.ts
// Verificar banners en Turso

import { config } from 'dotenv';
import { createClient } from '@libsql/client';

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
  const client = createClient({ url, authToken });

  console.log('🔍 Verificando SystemConfig en Turso...\n');

  const result = await client.execute("SELECT * FROM SystemConfig WHERE key = 'banners'");
  
  if (result.rows.length === 0) {
    console.log('❌ No hay banners guardados en SystemConfig');
  } else {
    console.log('✅ Banners encontrados:');
    console.log(JSON.parse(result.rows[0].value as string));
  }

  // Mostrar todas las configs
  console.log('\n📋 Todas las SystemConfig:');
  const all = await client.execute('SELECT key, value FROM SystemConfig');
  all.rows.forEach(row => {
    const val = (row.value as string).substring(0, 50);
    console.log(`   ${row.key}: ${val}...`);
  });

  client.close();
}

main().catch(console.error);
