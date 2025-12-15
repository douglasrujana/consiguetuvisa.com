import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

async function main() {
  const sources = await prisma.source.count();
  const docs = await prisma.kBDocument.count();
  const chunks = await prisma.chunk.count();
  
  console.log('📊 Knowledge Base Stats:');
  console.log(`   Sources: ${sources}`);
  console.log(`   Documents: ${docs}`);
  console.log(`   Chunks: ${chunks}`);
  
  // Listar sources
  const allSources = await prisma.source.findMany({
    include: { _count: { select: { documents: true } } }
  });
  
  console.log('\n📁 Sources:');
  for (const s of allSources) {
    console.log(`   - ${s.name} (${s._count.documents} docs)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
