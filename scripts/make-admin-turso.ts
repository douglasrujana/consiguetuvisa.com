/**
 * Convierte un usuario en Admin en Turso (remoto)
 * 
 * Uso: npx tsx scripts/make-admin-turso.ts <email>
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { config } from 'dotenv';

// Cargar .env.local
config({ path: '.env.local' });

// Usar Turso remoto
const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbUrl.startsWith('libsql://')) {
  console.log('❌ DATABASE_URL debe ser una URL de Turso (libsql://)');
  console.log('   Actual:', dbUrl);
  process.exit(1);
}

console.log('[Turso] Conectando a:', dbUrl.substring(0, 50) + '...');

const adapter = new PrismaLibSql({ url: dbUrl, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('❌ Uso: npx tsx scripts/make-admin-turso.ts <email>');
    
    const users = await prisma.user.findMany({
      select: { email: true, role: true, externalId: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    if (users.length > 0) {
      console.log('\n📋 Usuarios en Turso:');
      users.forEach(u => {
        const hasClerk = u.externalId ? '✓' : '✗';
        console.log(`   ${u.role === 'ADMIN' ? '👑' : '👤'} ${u.email} (${u.role}) [Clerk: ${hasClerk}]`);
      });
    }
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`❌ Usuario no encontrado en Turso: ${email}`);
    process.exit(1);
  }

  console.log('Usuario actual:', JSON.stringify(user, null, 2));

  if (user.role === 'ADMIN') {
    console.log(`✅ ${email} ya es ADMIN en Turso`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`\n✅ ${email} ahora es ADMIN en Turso 👑`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
