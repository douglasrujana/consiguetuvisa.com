/**
 * Sincroniza el schema de Turso con las nuevas columnas/tablas
 * Agrega campos faltantes sin borrar datos existentes
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

if (!dbUrl?.startsWith('libsql://')) {
  console.error('❌ DATABASE_URL debe ser Turso (libsql://)');
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken });

async function sync() {
  console.log('🔄 Sincronizando schema con Turso...');
  console.log(`   URL: ${dbUrl.substring(0, 50)}...`);

  try {
    // 1. Verificar si existe la columna 'role' en User
    const userInfo = await client.execute("PRAGMA table_info(User)");
    const columns = userInfo.rows.map((r: any) => r.name);
    console.log('\n📋 Columnas actuales en User:', columns.join(', '));

    if (!columns.includes('role')) {
      console.log('\n➕ Agregando columna "role" a User...');
      await client.execute("ALTER TABLE User ADD COLUMN role TEXT DEFAULT 'USER'");
      console.log('   ✅ Columna "role" agregada');
    } else {
      console.log('   ✅ Columna "role" ya existe');
    }

    // 2. Crear tabla Participation si no existe
    console.log('\n📦 Verificando tabla Participation...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Participation (
        id TEXT PRIMARY KEY,
        campaignId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        country TEXT DEFAULT 'EC',
        selectedCards TEXT NOT NULL,
        totalSpins INTEGER DEFAULT 1,
        spinsUsed INTEGER DEFAULT 0,
        prizeId TEXT,
        prizeName TEXT,
        prizeCode TEXT UNIQUE,
        prizeStatus TEXT DEFAULT 'PENDING',
        verifiedAt TEXT,
        verifiedBy TEXT,
        deliveredAt TEXT,
        crmLeadId TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        source TEXT DEFAULT 'WEB',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('   ✅ Tabla Participation OK');

    // 3. Crear índices
    console.log('\n📇 Creando índices...');
    await client.execute("CREATE INDEX IF NOT EXISTS idx_participation_campaign ON Participation(campaignId)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_participation_email ON Participation(email)");
    await client.execute("CREATE INDEX IF NOT EXISTS idx_participation_code ON Participation(prizeCode)");
    console.log('   ✅ Índices creados');

    // 4. Actualizar usuario admin
    console.log('\n👑 Actualizando rol de admin...');
    const result = await client.execute({
      sql: "UPDATE User SET role = 'ADMIN' WHERE email = ?",
      args: ['drrclabx@gmail.com']
    });
    console.log(`   ✅ ${result.rowsAffected} usuario(s) actualizado(s)`);

    // 5. Verificar
    const user = await client.execute({
      sql: "SELECT email, role FROM User WHERE email = ?",
      args: ['drrclabx@gmail.com']
    });
    if (user.rows[0]) {
      console.log(`   Usuario: ${user.rows[0].email} -> ${user.rows[0].role}`);
    }

    console.log('\n✅ Sincronización completada!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sync();
