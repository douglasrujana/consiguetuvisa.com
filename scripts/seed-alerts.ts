import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

const SAMPLE_ALERTS = [
  { type: 'COMPLAINT', priority: 'HIGH', title: 'Queja sobre tiempo de respuesta', content: 'Un cliente reportó que el tiempo de espera para la cita consular fue muy largo.' },
  { type: 'POLICY_CHANGE', priority: 'CRITICAL', title: 'Cambio en requisitos de visa B1/B2', content: 'La embajada de USA actualizó los requisitos de documentación para visas de turista.' },
  { type: 'SYSTEM_ERROR', priority: 'MEDIUM', title: 'Error en formulario de contacto', content: 'Se detectaron 3 errores de envío en el formulario de contacto en las últimas 24 horas.' },
  { type: 'MENTION', priority: 'LOW', title: 'Mención positiva en Twitter', content: '@usuario123 mencionó: "Excelente servicio de ConsigueTuVisa, muy recomendado!"' },
  { type: 'COMPLAINT', priority: 'MEDIUM', title: 'Solicitud de reembolso', content: 'Cliente solicita reembolso parcial por servicio de asesoría.' },
  { type: 'SYSTEM_ERROR', priority: 'HIGH', title: 'Fallo en integración de pagos', content: 'Se detectó un error intermitente en la pasarela de pagos.' },
];

async function main() {
  console.log('🔔 Seeding Alerts...');
  
  for (const alert of SAMPLE_ALERTS) {
    await prisma.alert.create({
      data: {
        type: alert.type as any,
        priority: alert.priority as any,
        title: alert.title,
        content: alert.content,
      }
    });
    console.log(`  ✓ ${alert.title}`);
  }
  
  console.log(`\n✅ ${SAMPLE_ALERTS.length} alertas creadas`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
