/**
 * Seed de usuarios para desarrollo/testing
 * Crea StaffMembers (equipo interno) y Customers (clientes)
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

// Equipo interno (StaffMember)
const staffMembers = [
  {
    email: 'admin@consiguetuvisa.com',
    firstName: 'Admin',
    lastName: 'Sistema',
    role: 'ADMIN',
    department: 'Tecnología',
    isActive: true,
  },
  {
    email: 'ventas@consiguetuvisa.com',
    firstName: 'María',
    lastName: 'González',
    role: 'SALES',
    department: 'Ventas',
    isActive: true,
  },
  {
    email: 'soporte@consiguetuvisa.com',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    role: 'SUPPORT',
    department: 'Soporte',
    isActive: true,
  },
  {
    email: 'community@consiguetuvisa.com',
    firstName: 'Ana',
    lastName: 'Martínez',
    role: 'COMMUNITY',
    department: 'Marketing',
    isActive: true,
  },
  {
    email: 'dev@consiguetuvisa.com',
    firstName: 'Pedro',
    lastName: 'López',
    role: 'DEV',
    department: 'Tecnología',
    isActive: true,
  },
];

// Clientes externos (Customer)
const customers = [
  {
    email: 'juan.perez@gmail.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+593987654321',
    source: 'web',
    status: 'ACTIVE',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'ana.martinez@gmail.com',
    firstName: 'Ana',
    lastName: 'Martínez',
    phone: '+593912345678',
    source: 'referral',
    status: 'ACTIVE',
    isActive: true,
    emailVerified: true,
  },
  {
    email: 'roberto.sanchez@empresa.com',
    firstName: 'Roberto',
    lastName: 'Sánchez',
    phone: '+593911223344',
    source: 'ads',
    status: 'LEAD',
    isActive: true,
    emailVerified: false,
  },
  {
    email: 'maria.garcia@hotmail.com',
    firstName: 'María',
    lastName: 'García',
    phone: '+593998877665',
    source: 'social',
    status: 'LEAD',
    isActive: true,
    emailVerified: false,
  },
  {
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'Usuario',
    phone: '+593900000000',
    source: 'web',
    status: 'LEAD',
    isActive: true,
    emailVerified: false,
  },
];

async function main() {
  console.log('🌱 Iniciando seed de usuarios...\n');

  // Crear StaffMembers
  console.log('👥 Creando equipo interno (StaffMember)...');
  for (const staffData of staffMembers) {
    try {
      const existing = await prisma.staffMember.findUnique({
        where: { email: staffData.email },
      });

      if (existing) {
        console.log(`⏭️  Staff ya existe: ${staffData.email}`);
        continue;
      }

      const staff = await prisma.staffMember.create({
        data: staffData,
      });

      const roleEmoji = {
        ADMIN: '👑',
        SALES: '💼',
        SUPPORT: '🎧',
        COMMUNITY: '📱',
        DEV: '💻',
      }[staff.role] || '👤';
      
      console.log(`✅ ${roleEmoji} Creado: ${staff.email} (${staff.role})`);
    } catch (error) {
      console.error(`❌ Error creando staff ${staffData.email}:`, error);
    }
  }

  // Crear Customers
  console.log('\n👤 Creando clientes (Customer)...');
  for (const customerData of customers) {
    try {
      const existing = await prisma.customer.findUnique({
        where: { email: customerData.email },
      });

      if (existing) {
        console.log(`⏭️  Cliente ya existe: ${customerData.email}`);
        continue;
      }

      const customer = await prisma.customer.create({
        data: customerData,
      });

      const statusEmoji = customer.status === 'ACTIVE' ? '✅' : '🔵';
      console.log(`${statusEmoji} Creado: ${customer.email} (${customer.status})`);
    } catch (error) {
      console.error(`❌ Error creando cliente ${customerData.email}:`, error);
    }
  }

  // Mostrar resumen
  console.log('\n📊 Resumen:');
  
  const staffCounts = await prisma.staffMember.groupBy({
    by: ['role'],
    _count: true,
  });
  console.log('\n   Equipo interno:');
  staffCounts.forEach((c) => {
    const emoji = { ADMIN: '👑', SALES: '💼', SUPPORT: '🎧', COMMUNITY: '📱', DEV: '💻' }[c.role] || '👤';
    console.log(`   ${emoji} ${c.role}: ${c._count}`);
  });
  
  const staffTotal = await prisma.staffMember.count();
  console.log(`   📦 Total Staff: ${staffTotal}`);

  const customerCounts = await prisma.customer.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log('\n   Clientes:');
  customerCounts.forEach((c) => {
    const emoji = c.status === 'ACTIVE' ? '✅' : c.status === 'LEAD' ? '🔵' : '⚪';
    console.log(`   ${emoji} ${c.status}: ${c._count}`);
  });
  
  const customerTotal = await prisma.customer.count();
  console.log(`   📦 Total Clientes: ${customerTotal}`);

  console.log('\n✨ Seed completado!');
  console.log('\n🔐 Para acceder como Admin:');
  console.log('   1. Registra admin@consiguetuvisa.com en Clerk');
  console.log('   2. Actualiza el clerkId en la tabla StaffMember');
  console.log('   3. O usa: UPDATE StaffMember SET clerkId = "user_xxx" WHERE email = "admin@consiguetuvisa.com"');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
