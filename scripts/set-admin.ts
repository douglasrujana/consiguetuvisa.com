// scripts/set-admin.ts
// Actualiza el rol de un usuario a ADMIN
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

async function main() {
  const email = process.argv[2] || 'drrclabx@gmail.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });
  
  console.log(`✅ Usuario ${user.email} actualizado a rol: ${user.role}`);
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect?.());
