// scripts/link-admin-turso.ts
// Vincula el clerkId al StaffMember en Turso
// Uso: pnpm exec tsx scripts/link-admin-turso.ts

import { config } from 'dotenv';
import { createClient } from '@libsql/client';

// Cargar .env.local con override
config({ path: '.env.local', override: true });

const TURSO_URL = process.env.DATABASE_URL || '';
const CLERK_SECRET = process.env.CLERK_SECRET_KEY || '';

function parseConnectionString(connStr: string): { url: string; authToken?: string } {
  if (connStr.includes('?authToken=')) {
    const idx = connStr.indexOf('?authToken=');
    const baseUrl = connStr.substring(0, idx);
    const token = connStr.substring(idx + 11);
    return { url: baseUrl, authToken: token };
  }
  return { url: connStr, authToken: process.env.TURSO_AUTH_TOKEN };
}

async function main() {
  console.log('🔗 Vinculando clerkId al admin en Turso...\n');

  const { url, authToken } = parseConnectionString(TURSO_URL);
  const client = createClient({ url, authToken });

  const adminEmail = 'drrclabx@gmail.com';

  // Obtener clerkId desde Clerk API
  console.log('📡 Consultando Clerk API...');
  
  const clerkResponse = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(adminEmail)}`,
    {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!clerkResponse.ok) {
    console.error('❌ Error consultando Clerk:', await clerkResponse.text());
    process.exit(1);
  }

  const clerkUsers = await clerkResponse.json();
  
  if (clerkUsers.length === 0) {
    console.error('❌ Usuario no encontrado en Clerk');
    console.log('   Asegúrate de haber iniciado sesión en la app con este email');
    process.exit(1);
  }

  const clerkId = clerkUsers[0].id;
  console.log(`✅ ClerkId encontrado: ${clerkId}`);

  // Actualizar StaffMember con clerkId
  await client.execute({
    sql: 'UPDATE StaffMember SET clerkId = ? WHERE email = ?',
    args: [clerkId, adminEmail]
  });

  console.log('✅ StaffMember actualizado con clerkId');

  // Verificar resultado
  const result = await client.execute({
    sql: 'SELECT id, email, firstName, lastName, role, clerkId FROM StaffMember WHERE email = ?',
    args: [adminEmail]
  });

  console.log('\n📋 Registro actualizado:');
  console.log(result.rows[0]);

  client.close();
  console.log('\n🎉 Admin vinculado correctamente!');
}

main().catch(console.error);
