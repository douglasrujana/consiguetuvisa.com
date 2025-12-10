/**
 * Verifica un usuario en la DB
 */
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || 'drrclabx@gmail.com';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    console.log('Usuario encontrado:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('Usuario no encontrado:', email);
  }
}

main().finally(() => prisma.$disconnect());
