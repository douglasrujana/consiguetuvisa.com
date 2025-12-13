// prisma/seed-knowledge-prod.ts
// Script para poblar la Knowledge Base en PRODUCCIÓN (Turso)

import { config } from 'dotenv';
config({ path: '.env.local' });

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Conectar a Turso producción
const tursoUrl = 'libsql://consiguetuvisa-douglasrujana.aws-us-east-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoToken) {
  throw new Error('TURSO_AUTH_TOKEN not set');
}

console.log('[Turso] Conectando a:', tursoUrl);
const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
const prisma = new PrismaClient({ adapter });

const KNOWLEDGE_DOCUMENTS = [
  {
    id: 'visa-usa-requisitos',
    title: 'Requisitos Visa USA B1/B2',
    content: `Requisitos para visa de turista B1/B2 a Estados Unidos:
    1. Pasaporte vigente con mínimo 6 meses de validez
    2. Formulario DS-160 completado online
    3. Foto digital reciente (5x5 cm, fondo blanco)
    4. Comprobante de pago de tarifa consular ($185 USD)
    5. Carta de invitación (opcional pero recomendada)
    6. Prueba de solvencia económica (estados de cuenta)
    7. Prueba de vínculos con tu país (trabajo, propiedades, familia)`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-usa-costos',
    title: 'Costos Visa USA B1/B2',
    content: `Costos y precios de la visa americana B1/B2 (turista/negocios):
    - Tarifa consular MRV: $185 USD (no reembolsable)
    - Tarifa de reciprocidad (según país): varía
    - Servicio de asesoría ConsigueTuVisa: desde $50 USD
    - Fotos profesionales: $5-10 USD
    - Traducción de documentos: $15-30 USD por página
    El pago de la tarifa consular se realiza en el banco autorizado antes de agendar la cita.
    La visa B1/B2 tiene validez de hasta 10 años con entradas múltiples.`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-usa-entrevista',
    title: 'Entrevista Consular USA',
    content: `Preparación para la entrevista consular de visa americana:
    - Llegar 15 minutos antes de la cita
    - No se permiten dispositivos electrónicos
    - Llevar documentos originales y copias
    - Vestir formal pero cómodo
    - Responder con honestidad y brevedad
    - Preguntas típicas: motivo del viaje, duración, financiamiento, lazos con tu país
    - Mantener contacto visual y actitud positiva`,
    source: 'guia-visa-usa.md',
  },
  {
    id: 'visa-canada-requisitos',
    title: 'Requisitos Visa Canadá',
    content: `Requisitos para visa de turista a Canadá (Visitor Visa):
    1. Pasaporte vigente
    2. Formulario IMM 5257 completado
    3. Dos fotos tamaño pasaporte
    4. Prueba de fondos suficientes (mínimo $1000 CAD por semana)
    5. Carta de empleo o estados de cuenta bancarios
    6. Itinerario de viaje detallado
    7. Carta de invitación si visitas familia/amigos`,
    source: 'guia-visa-canada.md',
  },
  {
    id: 'visa-canada-costos',
    title: 'Costos Visa Canadá',
    content: `Costos y precios de la visa canadiense (Visitor Visa):
    - Tarifa de procesamiento: $100 CAD (aproximadamente $75 USD)
    - Datos biométricos: $85 CAD (una sola vez, válido por 10 años)
    - Total aproximado: $185 CAD ($140 USD)
    - Servicio de asesoría ConsigueTuVisa: desde $50 USD
    El tiempo de procesamiento es de 2-4 semanas aproximadamente.
    La visa de visitante puede tener validez de hasta 10 años.`,
    source: 'guia-visa-canada.md',
  },
  {
    id: 'servicios-asesoria',
    title: 'Servicios ConsigueTuVisa',
    content: `Servicios de ConsigueTuVisa.com:
    - Asesoría personalizada para trámites de visa
    - Revisión completa de documentos
    - Preparación para entrevista consular
    - Llenado de formularios (DS-160, IMM 5257, etc.)
    - Seguimiento del proceso
    - Atención en español
    Contacto: +593 99 123 4567 | info@consiguetuvisa.com
    Horario: Lunes a Viernes 9am-6pm`,
    source: 'servicios.md',
  },
  {
    id: 'visa-schengen',
    title: 'Requisitos Visa Schengen',
    content: `Requisitos para visa Schengen (Europa):
    1. Pasaporte con validez mínima de 3 meses después del viaje
    2. Formulario de solicitud completado
    3. Fotos tamaño pasaporte
    4. Seguro de viaje con cobertura mínima de 30,000 EUR
    5. Reserva de vuelos y hoteles
    6. Prueba de medios económicos
    7. Carta de empleo o constancia de estudios
    La visa Schengen permite visitar 27 países europeos.`,
    source: 'guia-visa-schengen.md',
  },
];

async function seed() {
  console.log('🌱 Seeding Knowledge Base en PRODUCCIÓN (Turso)...');

  // 1. Crear Source principal
  const source = await prisma.source.upsert({
    where: { id: 'kb-visas-main' },
    update: {
      name: 'Guías de Visas',
      updatedAt: new Date(),
    },
    create: {
      id: 'kb-visas-main',
      type: 'MANUAL',
      name: 'Guías de Visas',
      config: JSON.stringify({
        description: 'Documentos principales sobre requisitos y costos de visas',
        category: 'visas',
      }),
      isActive: true,
    },
  });
  console.log(`✓ Source creado: ${source.name}`);

  // 2. Crear KBDocuments
  for (const doc of KNOWLEDGE_DOCUMENTS) {
    const contentHash = Buffer.from(doc.content).toString('base64').slice(0, 32);
    
    const kbDoc = await prisma.kBDocument.upsert({
      where: {
        sourceId_externalId: {
          sourceId: source.id,
          externalId: doc.id,
        },
      },
      update: {
        title: doc.title,
        contentHash,
        metadata: JSON.stringify({ originalSource: doc.source }),
        updatedAt: new Date(),
      },
      create: {
        sourceId: source.id,
        externalId: doc.id,
        title: doc.title,
        contentHash,
        status: 'PENDING',
        metadata: JSON.stringify({ originalSource: doc.source }),
      },
    });

    // 3. Crear Chunk para cada documento
    await prisma.chunk.upsert({
      where: { id: doc.id },
      update: {
        content: doc.content,
        metadata: JSON.stringify({ source: doc.source }),
      },
      create: {
        id: doc.id,
        documentId: kbDoc.id,
        content: doc.content,
        position: 0,
        metadata: JSON.stringify({ source: doc.source }),
      },
    });

    console.log(`  ✓ Documento: ${doc.title}`);
  }

  // Actualizar estado de documentos
  await prisma.kBDocument.updateMany({
    where: { sourceId: source.id },
    data: { status: 'INDEXED', indexedAt: new Date() },
  });

  console.log(`\n✅ ${KNOWLEDGE_DOCUMENTS.length} documentos insertados en Turso PRODUCCIÓN`);
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
