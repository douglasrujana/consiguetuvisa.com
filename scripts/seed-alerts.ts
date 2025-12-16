// scripts/seed-alerts.ts
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { prisma } from '../src/server/db/prisma-singleton';

async function main() {
  console.log('🌱 Seeding Alerts...\n');

  // Get domains
  const ops = await prisma.alertDomain.findUnique({ where: { name: 'operations' } });
  const biz = await prisma.alertDomain.findUnique({ where: { name: 'business' } });
  const soc = await prisma.alertDomain.findUnique({ where: { name: 'social' } });

  if (!ops || !biz || !soc) {
    console.log('❌ Run seed-alert-domains.ts first');
    return;
  }

  const alerts = [
    // Operations
    { domainId: ops.id, type: 'SYSTEM_ERROR', priority: 'CRITICAL', title: 'Error en API de Gemini', content: 'Rate limit excedido. Revisar cuotas.' },
    { domainId: ops.id, type: 'SYSTEM_ERROR', priority: 'HIGH', title: 'Latencia alta en BD', content: 'Queries tomando >2s. Revisar índices.' },
    { domainId: ops.id, type: 'POLICY_CHANGE', priority: 'MEDIUM', title: 'Actualización de Clerk', content: 'Nueva versión disponible con breaking changes.' },
    // Business
    { domainId: biz.id, type: 'MENTION', priority: 'HIGH', title: 'Nueva solicitud urgente', content: 'Cliente VIP solicita visa USA para viaje en 2 semanas.' },
    { domainId: biz.id, type: 'COMPLAINT', priority: 'HIGH', title: 'Queja de cliente', content: 'Cliente reporta demora en respuesta de 3 días.' },
    { domainId: biz.id, type: 'MENTION', priority: 'LOW', title: 'Lead desde WhatsApp', content: 'Nuevo lead interesado en visa Canadá.' },
    // Social
    { domainId: soc.id, type: 'MENTION', priority: 'MEDIUM', title: 'Mención en Twitter', content: '@consiguetuvisa mencionado en hilo viral sobre visas.' },
    { domainId: soc.id, type: 'COMPLAINT', priority: 'HIGH', title: 'Review negativa', content: 'Review 1 estrella en Google: "Muy lentos".' },
  ];

  for (const a of alerts) {
    await prisma.alert.create({ data: a as any });
    console.log(`✅ ${a.title}`);
  }

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
