/**
 * Convierte un usuario existente en Admin
 * 
 * Uso: npx tsx scripts/make-admin.ts <email>
 * Ejemplo: npx tsx scripts/make-admin.ts tu-email@gmail.com
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const config = dbUrl.startsWith('libsql://') ? { url: dbUrl, authToken } : { url: dbUrl };
const adapter = new PrismaLibSql(config);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('❌ Uso: npx tsx scripts/make-admin.ts <email>');
    console.log('   Ejemplo: npx tsx scripts/make-admin.ts drrclabx@gmail.com');
    
    // Mostrar usuarios existentes
    const users = await prisma.user.findMany({
      select: { email: true, role: true, externalId: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    if (users.length > 0) {
      console.log('\n📋 Usuarios recientes:');
      users.forEach(u => {
        const hasClerk = u.externalId ? '✓ Clerk' : '✗ Sin Clerk';
        console.log(`   ${u.role === 'ADMIN' ? '👑' : '👤'} ${u.email} (${u.role}) [${hasClerk}]`);
      });
    }
    
    process.exit(1);
  }

  // Buscar usuario
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`❌ Usuario no encontrado: ${email}`);
    console.log('   El usuario debe existir en la DB (haberse logueado al menos una vez)');
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log(`✅ ${email} ya es ADMIN`);
    process.exit(0);
  }

  // Actualizar a ADMIN
  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`✅ ${email} ahora es ADMIN 👑`);
  console.log('\n🔗 Ahora puedes acceder a /admin');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
