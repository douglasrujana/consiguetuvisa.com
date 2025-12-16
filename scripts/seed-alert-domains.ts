// scripts/seed-alert-domains.ts
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { prisma } from '../src/server/db/prisma-singleton';

const DOMAINS = [
  {
    id: 'dom_operations',
    name: 'operations',
    displayName: 'Operaciones',
    description: 'Alertas técnicas: errores, DB, cuotas, seguridad',
    icon: 'server',
    color: '#ef4444',
    allowedRoles: JSON.stringify(['ADMIN', 'DEV']),
    sortOrder: 1,
  },
  {
    id: 'dom_business',
    name: 'business',
    displayName: 'Negocio',
    description: 'Alertas comerciales: leads, pagos, citas, quejas',
    icon: 'briefcase',
    color: '#3b82f6',
    allowedRoles: JSON.stringify(['ADMIN', 'SALES']),
    sortOrder: 2,
  },
  {
    id: 'dom_social',
    name: 'social',
    displayName: 'Social',
    description: 'Alertas sociales: menciones, sentimiento, tendencias',
    icon: 'message-circle',
    color: '#10b981',
    allowedRoles: JSON.stringify(['ADMIN', 'COMMUNITY']),
    sortOrder: 3,
  },
];

async function main() {
  console.log('🌱 Seeding AlertDomains...\n');

  for (const d of DOMAINS) {
    await prisma.alertDomain.upsert({
      where: { name: d.name },
      update: d,
      create: d,
    });
    console.log(`✅ ${d.displayName}`);
  }

  // Actualizar alertas existentes sin domainId
  const ops = await prisma.alertDomain.findUnique({ where: { name: 'operations' } });
  if (ops) {
    const updated = await prisma.alert.updateMany({
      where: { domainId: '' },
      data: { domainId: ops.id },
    });
    if (updated.count > 0) {
      console.log(`\n🔄 ${updated.count} alertas migradas a 'operations'`);
    }
  }

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
