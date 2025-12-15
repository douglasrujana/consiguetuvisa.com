/**
 * Vincula el clerkId del User legacy al StaffMember
 * Ejecutar: pnpm exec tsx scripts/link-admin.ts
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'drrclabx@gmail.com';
  
  // 1. Buscar el User legacy para obtener el clerkId
  const legacyUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  console.log('📋 User legacy:', legacyUser);
  
  if (!legacyUser?.externalId) {
    console.log('❌ No se encontró User legacy con externalId');
    return;
  }
  
  // 2. Buscar el StaffMember
  const staff = await prisma.staffMember.findUnique({
    where: { email: adminEmail }
  });
  
  console.log('📋 StaffMember actual:', staff);
  
  if (!staff) {
    console.log('❌ No existe StaffMember con ese email');
    return;
  }
  
  // 3. Actualizar el StaffMember con el clerkId
  const updated = await prisma.staffMember.update({
    where: { email: adminEmail },
    data: { clerkId: legacyUser.externalId }
  });
  
  console.log('✅ StaffMember actualizado con clerkId:', updated);
  
  // 4. Marcar el User legacy como migrado
  await prisma.user.update({
    where: { email: adminEmail },
    data: { migratedTo: 'staff' }
  });
  
  console.log('✅ User legacy marcado como migrado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
