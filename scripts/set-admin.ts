/**
 * Actualiza el admin con tu email de Clerk
 * Ejecutar: pnpm exec tsx scripts/set-admin.ts
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Tu email de Clerk
  const adminEmail = 'drrclabx@gmail.com';
  
  // Verificar si ya existe como staff
  const existing = await prisma.staffMember.findUnique({
    where: { email: adminEmail }
  });
  
  if (existing) {
    console.log('✅ Ya existe como StaffMember:', existing);
    return;
  }
  
  // Crear nuevo StaffMember con tu email
  const admin = await prisma.staffMember.create({
    data: {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'LabX',
      role: 'ADMIN',
      department: 'Tecnología',
      isActive: true,
    }
  });
  
  console.log('✅ Admin creado:', admin);
  console.log('\n📝 Ahora cuando te loguees con Clerk, el middleware');
  console.log('   buscará por email y te asignará el rol ADMIN.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
