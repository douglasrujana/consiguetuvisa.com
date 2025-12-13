// scripts/seed-all.ts
// Seed completo para todas las tablas de la BD
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';
import { randomUUID } from 'crypto';

// Helpers
const randomDate = (start: Date, end: Date) => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const VISA_TYPES = ['USA_TURISMO', 'CANADA_VISITANTE', 'SCHENGEN', 'UK', 'MEXICO'];
const COUNTRIES = ['Estados Unidos', 'Canadá', 'España', 'Reino Unido', 'México', 'Francia', 'Italia'];
const STATUSES = ['NUEVA', 'EN_REVISION', 'DOCUMENTOS', 'FORMULARIO', 'CITA_AGENDADA', 'ENTREVISTA', 'APROBADA', 'RECHAZADA'];
const CITIES = ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Loja', 'Riobamba'];
const SOURCES = ['WEB', 'WHATSAPP', 'REFERIDO', 'LANDING'];
const DOC_TYPES = ['PASAPORTE', 'FOTO', 'COMPROBANTE_INGRESOS', 'CARTA_TRABAJO', 'DS160'];
const DOC_STATUSES = ['PENDIENTE', 'RECIBIDO', 'APROBADO', 'RECHAZADO'];
const NAMES = ['María García', 'Carlos Mendoza', 'Ana Rodríguez', 'Luis Pérez', 'Carmen López', 'José Martínez', 'Laura Sánchez', 'Pedro Gómez', 'Rosa Díaz', 'Miguel Torres'];
const FIRST_NAMES = ['María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Rosa', 'Miguel', 'Sofía', 'Diego', 'Valentina', 'Andrés', 'Isabella'];
const LAST_NAMES = ['García', 'Mendoza', 'Rodríguez', 'Pérez', 'López', 'Martínez', 'Sánchez', 'Gómez', 'Díaz', 'Torres', 'Flores', 'Rivera', 'Morales', 'Ortiz'];

async function seed() {
  console.log('🌱 Iniciando seed completo...\n');

  try {
    // 1. USUARIOS (20)
    console.log('👤 Creando usuarios...');
    const users: any[] = [];
    
    // Admin user (mantener el existente)
    const adminUser = await prisma.user.upsert({
      where: { email: 'drrclabx@gmail.com' },
      update: { role: 'ADMIN', firstName: 'Labx' },
      create: {
        email: 'drrclabx@gmail.com',
        firstName: 'Labx',
        role: 'ADMIN',
        externalId: 'user_36ZW3Bw3S6zJl6owZdlwGkPTwdC',
      },
    });
    users.push(adminUser);

    // Crear 19 usuarios más
    for (let i = 0; i < 19; i++) {
      const firstName = randomItem(FIRST_NAMES);
      const lastName = randomItem(LAST_NAMES);
      const user = await prisma.user.create({
        data: {
          email: `user${i + 1}@test.com`,
          firstName,
          lastName,
          phone: `+5939${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          role: i < 2 ? 'AGENT' : 'USER',
          isActive: Math.random() > 0.1,
        },
      });
      users.push(user);
    }
    console.log(`   ✓ ${users.length} usuarios creados`);

    // 2. SOLICITUDES (50)
    console.log('📋 Creando solicitudes...');
    const solicitudes: any[] = [];
    
    for (let i = 0; i < 50; i++) {
      const user = randomItem(users.slice(1)); // Excluir admin
      const status = randomItem(STATUSES);
      const currentStep = STATUSES.indexOf(status) + 1;
      
      const solicitud = await prisma.solicitud.create({
        data: {
          userId: user.id,
          visaType: randomItem(VISA_TYPES),
          destinationCountry: randomItem(COUNTRIES),
          status,
          currentStep: Math.min(currentStep, 5),
          totalSteps: 5,
          fullName: randomItem(NAMES),
          birthDate: randomDate(new Date(1970, 0, 1), new Date(2000, 0, 1)),
          nationality: 'Ecuatoriana',
          passportNumber: `EC${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          passportExpiry: randomDate(new Date(2025, 0, 1), new Date(2030, 0, 1)),
          phone: `+5939${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          email: user.email,
          city: randomItem(CITIES),
          travelPurpose: randomItem(['Turismo', 'Negocios', 'Visita familiar', 'Estudios']),
          travelDate: randomDate(new Date(2025, 0, 1), new Date(2025, 11, 31)),
          hasVisaHistory: Math.random() > 0.7,
          hasDenials: Math.random() > 0.9,
          source: randomItem(SOURCES),
          priority: randomItem(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
          appointmentDate: status === 'CITA_AGENDADA' ? randomDate(new Date(2025, 0, 1), new Date(2025, 6, 30)) : null,
        },
      });
      solicitudes.push(solicitud);
    }
    console.log(`   ✓ ${solicitudes.length} solicitudes creadas`);

    // 3. DOCUMENTOS (100)
    console.log('📄 Creando documentos...');
    let docCount = 0;
    
    for (const solicitud of solicitudes.slice(0, 30)) {
      const numDocs = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < numDocs; i++) {
        await prisma.document.create({
          data: {
            solicitudId: solicitud.id,
            userId: solicitud.userId,
            name: `Documento ${i + 1}`,
            type: randomItem(DOC_TYPES),
            fileName: `doc_${randomUUID().slice(0, 8)}.pdf`,
            fileSize: Math.floor(Math.random() * 5000000) + 100000,
            mimeType: 'application/pdf',
            status: randomItem(DOC_STATUSES),
          },
        });
        docCount++;
      }
    }
    console.log(`   ✓ ${docCount} documentos creados`);

    // 4. NOTAS (80)
    console.log('📝 Creando notas...');
    let noteCount = 0;
    const noteContents = [
      'Cliente contactado por WhatsApp',
      'Documentos recibidos, pendiente revisión',
      'Cita agendada para la próxima semana',
      'Preparación de entrevista completada',
      'Cliente solicita cambio de fecha',
      'Documentos aprobados',
      'Pendiente carta de trabajo',
      'Seguimiento realizado',
    ];
    
    for (const solicitud of solicitudes.slice(0, 40)) {
      const numNotes = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numNotes; i++) {
        await prisma.note.create({
          data: {
            solicitudId: solicitud.id,
            userId: solicitud.userId,
            content: randomItem(noteContents),
            type: randomItem(['GENERAL', 'INTERNO', 'CLIENTE', 'SISTEMA']),
            isInternal: Math.random() > 0.7,
            createdById: adminUser.id,
          },
        });
        noteCount++;
      }
    }
    console.log(`   ✓ ${noteCount} notas creadas`);

    // 5. STATUS HISTORY (100)
    console.log('📊 Creando historial de estados...');
    let historyCount = 0;
    
    for (const solicitud of solicitudes) {
      const numChanges = Math.floor(Math.random() * 3) + 1;
      let prevStatus = 'NUEVA';
      
      for (let i = 0; i < numChanges; i++) {
        const newStatus = STATUSES[Math.min(i + 1, STATUSES.length - 1)];
        await prisma.statusHistory.create({
          data: {
            solicitudId: solicitud.id,
            fromStatus: prevStatus,
            toStatus: newStatus,
            changedBy: adminUser.id,
            reason: 'Actualización de estado',
          },
        });
        prevStatus = newStatus;
        historyCount++;
      }
    }
    console.log(`   ✓ ${historyCount} registros de historial creados`);

    // 6. APPOINTMENTS (20)
    console.log('📅 Creando citas...');
    for (let i = 0; i < 20; i++) {
      const user = randomItem(users.slice(1));
      await prisma.appointment.create({
        data: {
          userId: user.id,
          serviceType: randomItem(['Asesoría inicial', 'Revisión documentos', 'Preparación entrevista', 'Seguimiento']),
          scheduledDate: randomDate(new Date(2025, 0, 1), new Date(2025, 6, 30)),
          status: randomItem(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
          notes: 'Cita programada',
        },
      });
    }
    console.log('   ✓ 20 citas creadas');

    // 7. PARTICIPATIONS (30)
    console.log('🎰 Creando participaciones de sorteo...');
    for (let i = 0; i < 30; i++) {
      const hasWon = Math.random() > 0.7;
      await prisma.participation.create({
        data: {
          campaignId: 'black-friday-2024',
          name: randomItem(NAMES),
          email: `participante${i + 1}@test.com`,
          phone: `+5939${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          country: 'EC',
          selectedCards: JSON.stringify(['visa-gold', 'mastercard-platinum'].slice(0, Math.floor(Math.random() * 2) + 1)),
          totalSpins: Math.floor(Math.random() * 3) + 1,
          spinsUsed: Math.floor(Math.random() * 2),
          prizeId: hasWon ? `prize_${i}` : null,
          prizeName: hasWon ? randomItem(['10% Descuento', '20% Descuento', 'Asesoría Gratis']) : null,
          prizeCode: hasWon ? `WIN${String(i).padStart(6, '0')}` : null,
          prizeStatus: hasWon ? randomItem(['PENDING', 'VERIFIED', 'DELIVERED']) : 'PENDING',
          source: randomItem(['WEB', 'KIOSK']),
        },
      });
    }
    console.log('   ✓ 30 participaciones creadas');

    // 8. KNOWLEDGE BASE - Sources (5)
    console.log('📚 Creando fuentes de conocimiento...');
    const sources = [];
    const sourceConfigs = [
      { type: 'MANUAL', name: 'Guías de Visa USA', config: '{}' },
      { type: 'MANUAL', name: 'Guías de Visa Canadá', config: '{}' },
      { type: 'MANUAL', name: 'Servicios de Asesoría', config: '{}' },
      { type: 'WEB', name: 'Blog ConsigueTuVisa', config: '{"url":"https://consiguetuvisa.com/blog"}' },
      { type: 'SANITY', name: 'CMS Content', config: '{"projectId":"zvbggttz"}' },
    ];
    
    for (const src of sourceConfigs) {
      const source = await prisma.source.create({
        data: {
          type: src.type as any,
          name: src.name,
          config: src.config,
          isActive: true,
        },
      });
      sources.push(source);
    }
    console.log(`   ✓ ${sources.length} fuentes creadas`);

    // 9. KB Documents (15)
    console.log('📖 Creando documentos de KB...');
    const kbDocs = [];
    const docTitles = [
      'Requisitos Visa USA B1/B2',
      'Costos Visa USA 2024',
      'Preparación Entrevista Consular',
      'Requisitos Visa Canadá',
      'Costos Visa Canadá',
      'Guía Visa Schengen',
      'Servicios de Asesoría',
      'Preguntas Frecuentes',
      'Proceso de Solicitud',
      'Documentos Necesarios',
    ];
    
    for (let i = 0; i < docTitles.length; i++) {
      const doc = await prisma.kBDocument.create({
        data: {
          sourceId: sources[i % sources.length].id,
          externalId: `doc-${i + 1}`,
          title: docTitles[i],
          contentHash: randomUUID(),
          status: 'INDEXED',
          indexedAt: new Date(),
        },
      });
      kbDocs.push(doc);
    }
    console.log(`   ✓ ${kbDocs.length} documentos KB creados`);

    // 10. Chunks (30)
    console.log('🧩 Creando chunks...');
    let chunkCount = 0;
    for (const doc of kbDocs) {
      const numChunks = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numChunks; i++) {
        await prisma.chunk.create({
          data: {
            documentId: doc.id,
            content: `Contenido del chunk ${i + 1} para ${doc.title}. Este es texto de ejemplo para pruebas.`,
            position: i,
            metadata: JSON.stringify({ source: doc.title }),
          },
        });
        chunkCount++;
      }
    }
    console.log(`   ✓ ${chunkCount} chunks creados`);

    // 11. Conversations & Messages (10 conversaciones, 50 mensajes)
    console.log('💬 Creando conversaciones...');
    for (let i = 0; i < 10; i++) {
      const conv = await prisma.conversation.create({
        data: {
          userId: users[i % users.length].id,
          title: `Consulta ${i + 1}`,
        },
      });
      
      const numMessages = Math.floor(Math.random() * 5) + 2;
      for (let j = 0; j < numMessages; j++) {
        await prisma.chatMessage.create({
          data: {
            conversationId: conv.id,
            role: j % 2 === 0 ? 'user' : 'assistant',
            content: j % 2 === 0 
              ? randomItem(['¿Cuáles son los requisitos para la visa USA?', '¿Cuánto cuesta?', '¿Cuánto tiempo toma?'])
              : 'Gracias por tu consulta. Los requisitos principales son...',
          },
        });
      }
    }
    console.log('   ✓ 10 conversaciones con mensajes creadas');

    // 12. Social Mentions (15)
    console.log('📱 Creando menciones sociales...');
    const sentiments = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'COMPLAINT'];
    for (let i = 0; i < 15; i++) {
      await prisma.socialMention.create({
        data: {
          sourceId: sources[0].id,
          platform: randomItem(['twitter', 'facebook', 'instagram']),
          externalId: `mention_${i + 1}`,
          author: `@user${i + 1}`,
          content: randomItem([
            'Excelente servicio de ConsigueTuVisa!',
            'Muy buena atención',
            'Tuve problemas con mi cita',
            'Recomiendo sus servicios',
          ]),
          sentiment: randomItem(sentiments) as any,
          publishedAt: randomDate(new Date(2024, 6, 1), new Date()),
        },
      });
    }
    console.log('   ✓ 15 menciones sociales creadas');

    // 13. Alerts (10)
    console.log('🚨 Creando alertas...');
    const alertTypes = ['COMPLAINT', 'POLICY_CHANGE', 'SYSTEM_ERROR', 'MENTION'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    for (let i = 0; i < 10; i++) {
      await prisma.alert.create({
        data: {
          type: randomItem(alertTypes) as any,
          priority: randomItem(priorities) as any,
          title: `Alerta ${i + 1}`,
          content: 'Descripción de la alerta de prueba',
          sourceId: sources[0].id,
          acknowledgedAt: Math.random() > 0.5 ? new Date() : null,
          acknowledgedBy: Math.random() > 0.5 ? adminUser.email : null,
        },
      });
    }
    console.log('   ✓ 10 alertas creadas');

    // 14. System Config (5)
    console.log('⚙️ Creando configuración del sistema...');
    const configs = [
      { key: 'site_name', value: 'ConsigueTuVisa', type: 'STRING' },
      { key: 'max_solicitudes_per_user', value: '10', type: 'NUMBER' },
      { key: 'enable_notifications', value: 'true', type: 'BOOLEAN' },
      { key: 'working_hours', value: '{"start":"09:00","end":"18:00"}', type: 'JSON' },
      { key: 'default_currency', value: 'USD', type: 'STRING' },
    ];
    
    for (const cfg of configs) {
      await prisma.systemConfig.upsert({
        where: { key: cfg.key },
        update: { value: cfg.value },
        create: cfg,
      });
    }
    console.log('   ✓ 5 configuraciones creadas');

    // Resumen
    console.log('\n✅ Seed completado!\n');
    console.log('📊 Resumen:');
    console.log(`   - Usuarios: ${users.length}`);
    console.log(`   - Solicitudes: ${solicitudes.length}`);
    console.log(`   - Documentos: ${docCount}`);
    console.log(`   - Notas: ${noteCount}`);
    console.log(`   - Historial: ${historyCount}`);
    console.log(`   - Citas: 20`);
    console.log(`   - Participaciones: 30`);
    console.log(`   - Fuentes KB: ${sources.length}`);
    console.log(`   - Documentos KB: ${kbDocs.length}`);
    console.log(`   - Chunks: ${chunkCount}`);
    console.log(`   - Conversaciones: 10`);
    console.log(`   - Menciones: 15`);
    console.log(`   - Alertas: 10`);
    console.log(`   - Configs: 5`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

seed()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect?.());
