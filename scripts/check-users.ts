// scripts/check-users.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      externalId: true,
    },
    take: 10,
  });
  
  console.log('Usuarios en la BD:');
  console.table(users);
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect?.());
