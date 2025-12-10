/**
 * Seed de usuarios para desarrollo/testing
 * Crea usuarios de prueba incluyendo Admin
 * 
 * Ejecutar: npx tsx scripts/seed-users.ts
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Configurar Prisma con adaptador LibSQL
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('[Prisma] Connecting to:', dbUrl.substring(0, 50) + '...');

const config = dbUrl.startsWith('libsql://')
  ? { url: dbUrl, authToken }
  : { url: dbUrl };

const adapter = new PrismaLibSql(config);
const prisma = new PrismaClient({ adapter });

const mockUsers = [
  {
    email: 'admin@consiguetuvisa.com',
    firstName: 'Admin',
    lastName: 'Sistema',
    phone: '+593999000001',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'agente1@consiguetuvisa.com',
    firstName: 'María',
    lastName: 'González',
    phone: '+593999000002',
    role: 'AGENT',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'agente2@consiguetuvisa.com',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    phone: '+593999000003',
    role: 'AGENT',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'usuario1@gmail.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+593987654321',
    role: 'USER',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'usuario2@gmail.com',
    firstName: 'Ana',
    lastName: 'Martínez',
    phone: '+593912345678',
    role: 'USER',
    isActive: true,
    emailVerified: false,
  },
  {
    email: 'usuario3@hotmail.com',
    firstName: 'Pedro',
    lastName: 'López',
    phone: '+593998877665',
    role: 'USER',
    isActive: false,
    emailVerified: true,
  },
  {
    email: 'cliente.vip@empresa.com',
    firstName: 'Roberto',
    lastName: 'Sánchez',
    phone: '+593911223344',
    role: 'USER',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'Usuario',
    phone: '+593900000000',
    role: 'USER',
    isActive: true,
    emailVerified: false,
  },
];

async function main() {
  console.log('🌱 Iniciando seed de usuarios...\n');

  for (const userData of mockUsers) {
    try {
      // Verificar si ya existe
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⏭️  Usuario ya existe: ${userData.email}`);
        continue;
      }

      // Crear usuario
      const user = await prisma.user.create({
        data: userData,
      });

      const roleEmoji = userData.role === 'ADMIN' ? '👑' : userData.role === 'AGENT' ? '🎯' : '👤';
      console.log(`✅ ${roleEmoji} Creado: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error creando ${userData.email}:`, error);
    }
  }

  // Mostrar resumen
  const counts = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  console.log('\n📊 Resumen de usuarios:');
  counts.forEach((c) => {
    const emoji = c.role === 'ADMIN' ? '👑' : c.role === 'AGENT' ? '🎯' : '👤';
    console.log(`   ${emoji} ${c.role}: ${c._count}`);
  });

  const total = await prisma.user.count();
  console.log(`   📦 Total: ${total}`);

  console.log('\n✨ Seed completado!');
  console.log('\n🔐 Credenciales Admin:');
  console.log('   Email: admin@consiguetuvisa.com');
  console.log('   (Usa Clerk para autenticación, el rol se asigna en la DB)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
