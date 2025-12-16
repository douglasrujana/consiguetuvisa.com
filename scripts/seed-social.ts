// scripts/seed-social.ts
// Seed de datos de prueba para Social Listening
// Ejecutar: pnpm exec tsx scripts/seed-social.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

const MENTIONS = [
  // Twitter - Positivos
  {
    platform: 'twitter',
    externalId: 'tw_001',
    author: 'maria_viajera',
    content: '¡Gracias @ConsigueTuVisa! Me aprobaron la visa B1/B2 en el primer intento. El equipo fue súper profesional y me guiaron en todo el proceso. 100% recomendados 🎉✈️',
    sentiment: 'POSITIVE',
    suggestedResponse: '¡Felicidades María! 🎉 Nos alegra mucho haber sido parte de tu éxito. ¡Buen viaje!',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
  },
  {
    platform: 'twitter',
    externalId: 'tw_002',
    author: 'carlos_ec',
    content: 'Excelente servicio de @ConsigueTuVisa. Muy atentos y resolvieron todas mis dudas sobre la visa canadiense. Ya tengo mi cita agendada 🇨🇦',
    sentiment: 'POSITIVE',
    suggestedResponse: '¡Gracias Carlos! Estamos aquí para ayudarte en cada paso. ¡Éxito en tu cita!',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  // Twitter - Neutrales
  {
    platform: 'twitter',
    externalId: 'tw_003',
    author: 'preguntones_ec',
    content: '¿Alguien sabe cuánto cuesta el servicio de @ConsigueTuVisa para visa americana? Estoy comparando opciones',
    sentiment: 'NEUTRAL',
    suggestedResponse: '¡Hola! Nuestros precios varían según el tipo de visa. Escríbenos al WhatsApp +593 99 123 4567 para una cotización personalizada.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    platform: 'twitter',
    externalId: 'tw_004',
    author: 'info_viajes',
    content: '@ConsigueTuVisa ¿Trabajan con visas Schengen también o solo USA y Canadá?',
    sentiment: 'NEUTRAL',
    suggestedResponse: '¡Hola! Sí, también tramitamos visas Schengen para Europa. Contáctanos para más información.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  // Twitter - Negativos
  {
    platform: 'twitter',
    externalId: 'tw_005',
    author: 'usuario_molesto',
    content: 'Llevo 3 días esperando respuesta de @ConsigueTuVisa y nada. El WhatsApp solo tiene visto azul 😤',
    sentiment: 'NEGATIVE',
    suggestedResponse: 'Lamentamos la demora. Te contactaremos de inmediato para resolver tu caso. Disculpa las molestias.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  // Twitter - Quejas
  {
    platform: 'twitter',
    externalId: 'tw_006',
    author: 'cliente_enojado',
    content: '@ConsigueTuVisa me cobraron $200 y nunca me dieron la asesoría completa. Quiero mi dinero de vuelta o voy a denunciar. Esto es una estafa.',
    sentiment: 'COMPLAINT',
    suggestedResponse: 'Lamentamos mucho esta situación. Por favor escríbenos a soporte@consiguetuvisa.com con tu número de caso para resolver esto de inmediato.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás - urgente
  },
  // Facebook - Positivos
  {
    platform: 'facebook',
    externalId: 'fb_001',
    author: 'Ana Lucia Mendez',
    content: 'Recomiendo totalmente a ConsigueTuVisa. Mi esposo y yo obtuvimos la visa americana gracias a ellos. Muy profesionales.',
    sentiment: 'POSITIVE',
    suggestedResponse: '¡Gracias Ana Lucia! Nos alegra haber ayudado a tu familia. ¡Disfruten su viaje!',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    platform: 'facebook',
    externalId: 'fb_002',
    author: 'Roberto Sanchez',
    content: 'Después de 2 rechazos por mi cuenta, contraté a ConsigueTuVisa y a la tercera fue la vencida. Valió cada centavo.',
    sentiment: 'POSITIVE',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
  // Facebook - Neutral
  {
    platform: 'facebook',
    externalId: 'fb_003',
    author: 'Lucia Torres',
    content: '¿ConsigueTuVisa tiene oficina física en Guayaquil o solo atienden online?',
    sentiment: 'NEUTRAL',
    suggestedResponse: '¡Hola Lucia! Tenemos oficinas en Quito y Guayaquil. También atendemos 100% online si lo prefieres.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
  },
  // Instagram - Positivos
  {
    platform: 'instagram',
    externalId: 'ig_001',
    author: 'viajera.ec',
    content: 'Mi experiencia con @consiguetuvisa fue increíble 💯 Super organizados y siempre disponibles. Ya tengo mi visa lista para NYC 🗽',
    sentiment: 'POSITIVE',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    platform: 'instagram',
    externalId: 'ig_002',
    author: 'familia.aventurera',
    content: 'Gracias @consiguetuvisa por ayudarnos con las 4 visas de la familia. Proceso súper fácil y rápido 🙌',
    sentiment: 'POSITIVE',
    suggestedResponse: '¡Gracias por confiar en nosotros! Que disfruten el viaje en familia 🎉',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
  },
  // Instagram - Negativo
  {
    platform: 'instagram',
    externalId: 'ig_003',
    author: 'decepcionado.ec',
    content: 'No me gustó que @consiguetuvisa tardara tanto en responder mis mensajes. El servicio fue ok pero la comunicación puede mejorar.',
    sentiment: 'NEGATIVE',
    suggestedResponse: 'Gracias por tu feedback. Estamos trabajando para mejorar nuestros tiempos de respuesta. Lamentamos la experiencia.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
  },
  // Más menciones para tener volumen
  {
    platform: 'twitter',
    externalId: 'tw_007',
    author: 'viajero_frecuente',
    content: '¿@ConsigueTuVisa ayuda con renovación de visa o solo primera vez?',
    sentiment: 'NEUTRAL',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 150),
  },
  {
    platform: 'facebook',
    externalId: 'fb_004',
    author: 'Pedro Alvarado',
    content: 'Acabo de agendar mi cita con ConsigueTuVisa. Espero que todo salga bien 🤞',
    sentiment: 'NEUTRAL',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 168),
  },
];

async function seed() {
  console.log('🌱 Seeding Social Mentions...\n');

  // Limpiar menciones existentes
  await prisma.socialMention.deleteMany();
  console.log('✓ Menciones anteriores eliminadas');

  // Crear menciones
  for (const mention of MENTIONS) {
    await prisma.socialMention.create({
      data: {
        sourceId: `source_${mention.platform}`,
        platform: mention.platform,
        externalId: mention.externalId,
        author: mention.author,
        content: mention.content,
        sentiment: mention.sentiment as any,
        suggestedResponse: mention.suggestedResponse,
        publishedAt: mention.publishedAt,
      },
    });
    console.log(`  ✓ ${mention.platform}: @${mention.author} (${mention.sentiment})`);
  }

  console.log(`\n✅ ${MENTIONS.length} menciones creadas`);

  // Stats
  const stats = await prisma.socialMention.groupBy({
    by: ['sentiment'],
    _count: { sentiment: true },
  });

  console.log('\n📊 Distribución:');
  for (const s of stats) {
    console.log(`   ${s.sentiment}: ${s._count.sentiment}`);
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
