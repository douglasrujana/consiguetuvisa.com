// scripts/setup-admin-turso.ts
// Crea el usuario admin en Turso (producción)
// Uso: pnpm exec tsx scripts/setup-admin-turso.ts

import { config } from 'dotenv';
import { createClient } from '@libsql/client';

// Cargar .env.local PRIMERO y con override
config({ path: '.env.local', override: true });

const TURSO_URL = process.env.DATABASE_URL || '';

function parseConnectionString(connStr: string): { url: string; authToken?: string } {
  console.log(`🔍 DATABASE_URL length: ${connStr.length}`);
  console.log(`🔍 Contains authToken: ${connStr.includes('authToken')}`);
  
  // Parsing manual porque URL no soporta bien libsql://
  if (connStr.includes('?authToken=')) {
    const idx = connStr.indexOf('?authToken=');
    const baseUrl = connStr.substring(0, idx);
    const token = connStr.substring(idx + 11); // 11 = '?authToken='.length
    console.log(`📡 URL: ${baseUrl}`);
    console.log(`🔑 Token length: ${token.length}`);
    return { url: baseUrl, authToken: token };
  }
  console.log(`📡 URL: ${connStr.substring(0, 50)}...`);
  console.log(`🔑 Token: Usando TURSO_AUTH_TOKEN`);
  return { url: connStr, authToken: process.env.TURSO_AUTH_TOKEN };
}

async function main() {
  console.log('🔧 Configurando admin en Turso...\n');

  const { url, authToken } = parseConnectionString(TURSO_URL);
  
  const client = createClient({ url, authToken });

  const adminEmail = 'drrclabx@gmail.com';
  const adminId = crypto.randomUUID();

  // Verificar si ya existe
  const existing = await client.execute({
    sql: 'SELECT * FROM StaffMember WHERE email = ?',
    args: [adminEmail]
  });

  if (existing.rows.length > 0) {
    console.log('⚠️  Usuario ya existe en StaffMember');
    console.log('   Actualizando rol a ADMIN...');
    
    await client.execute({
      sql: 'UPDATE StaffMember SET role = ?, isActive = 1 WHERE email = ?',
      args: ['ADMIN', adminEmail]
    });
    
    console.log('✅ Rol actualizado a ADMIN');
  } else {
    // Crear nuevo StaffMember
    await client.execute({
      sql: `INSERT INTO StaffMember (id, email, firstName, lastName, role, isActive, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [adminId, adminEmail, 'Douglas', 'Rujana', 'ADMIN']
    });
    
    console.log('✅ StaffMember creado con rol ADMIN');
  }

  // Verificar resultado
  const result = await client.execute({
    sql: 'SELECT id, email, firstName, lastName, role, clerkId FROM StaffMember WHERE email = ?',
    args: [adminEmail]
  });

  console.log('\n📋 Registro actual:');
  console.log(result.rows[0]);

  // Mostrar todos los StaffMembers
  const allStaff = await client.execute('SELECT id, email, role, clerkId FROM StaffMember');
  console.log('\n👥 Todos los StaffMembers:');
  allStaff.rows.forEach(row => {
    console.log(`   - ${row.email} (${row.role}) ${row.clerkId ? '✓ vinculado' : '○ sin vincular'}`);
  });

  client.close();
  console.log('\n🎉 Listo!');
}

main().catch(console.error);
