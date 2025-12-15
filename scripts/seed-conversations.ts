/**
 * Seed de Conversaciones del Chatbot
 * Ejecutar: pnpm exec tsx scripts/seed-conversations.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

const preguntas = [
  '¿Cuáles son los requisitos para la visa americana?',
  '¿Cuánto cuesta la visa de turismo a USA?',
  '¿Qué documentos necesito para la entrevista?',
  '¿Cuánto tiempo tarda el proceso de visa?',
  '¿Necesito cita para la entrevista?',
  '¿Puedo viajar con visa de turismo a trabajar?',
  '¿Qué pasa si me rechazan la visa?',
  '¿Cuánto dura la visa B1/B2?',
  '¿Necesito hablar inglés en la entrevista?',
  '¿Qué preguntan en la entrevista consular?',
  'Hola, necesito información sobre visas',
  '¿Tienen servicio de asesoría?',
  '¿Cuál es el costo de sus servicios?',
  '¿Me pueden ayudar con el formulario DS-160?',
  '¿Qué diferencia hay entre visa B1 y B2?',
];

const respuestas = [
  'Para la visa americana B1/B2 necesitas: pasaporte vigente, foto reciente, formulario DS-160, comprobante de pago de la tarifa consular ($185 USD), y documentos que demuestren vínculos con tu país.',
  'La tarifa consular de la visa B1/B2 es de $185 USD. Además, hay un costo de $16 USD por el servicio de citas. Nuestros servicios de asesoría tienen un costo adicional.',
  'Para la entrevista necesitas: pasaporte, confirmación del DS-160, confirmación de cita, foto, y documentos de soporte como carta de trabajo, estados de cuenta, y títulos de propiedad.',
  'El tiempo varía según la demanda. Actualmente, las citas pueden tardar entre 2-6 meses. El proceso completo desde que inicias hasta la entrevista puede ser de 3-8 meses.',
  'Sí, es obligatorio agendar una cita para la entrevista consular. Nosotros te ayudamos con todo el proceso de agendamiento.',
  'No, la visa de turismo B1/B2 no permite trabajar en Estados Unidos. Si trabajas con visa de turismo, puedes tener problemas legales y prohibición de entrada.',
  'Si te rechazan, puedes volver a aplicar. Es importante entender la razón del rechazo para mejorar tu siguiente aplicación. Nosotros te asesoramos en estos casos.',
  'La visa B1/B2 generalmente se otorga por 10 años, pero el oficial consular puede decidir darla por menos tiempo según tu caso.',
  'No es obligatorio hablar inglés. La entrevista puede ser en español. Lo importante es responder con claridad y seguridad.',
  'Las preguntas típicas son: propósito del viaje, duración, quién paga, a qué te dedicas, si tienes familia en USA, y cuándo planeas regresar.',
];

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 14) + 8); // 8am - 10pm
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function main() {
  console.log('🌱 Creando Conversaciones del Chatbot...\n');

  // Obtener algunos customers para asociar conversaciones
  const customers = await prisma.customer.findMany({ take: 10 });
  
  // Limpiar conversaciones existentes
  await prisma.chatMessage.deleteMany({});
  await prisma.conversation.deleteMany({});
  console.log('🗑️  Conversaciones anteriores eliminadas\n');

  // Crear 15 conversaciones
  for (let i = 0; i < 15; i++) {
    const hasCustomer = Math.random() > 0.4; // 60% tienen customer asociado
    const customer = hasCustomer ? customers[Math.floor(Math.random() * customers.length)] : null;
    const createdAt = randomDate(14); // Últimos 14 días
    
    const numMessages = Math.floor(Math.random() * 4) + 2; // 2-5 mensajes
    const preguntaIdx = Math.floor(Math.random() * preguntas.length);
    
    const conversation = await prisma.conversation.create({
      data: {
        customerId: customer?.id || null,
        title: preguntas[preguntaIdx].substring(0, 50) + (preguntas[preguntaIdx].length > 50 ? '...' : ''),
        createdAt,
        updatedAt: createdAt,
      }
    });

    // Crear mensajes
    const messages: { role: string; content: string; createdAt: Date }[] = [];
    let msgTime = new Date(createdAt);
    
    for (let j = 0; j < numMessages; j++) {
      const isUser = j % 2 === 0;
      msgTime = new Date(msgTime.getTime() + Math.random() * 60000); // +0-60 segundos
      
      messages.push({
        role: isUser ? 'user' : 'assistant',
        content: isUser 
          ? preguntas[(preguntaIdx + Math.floor(j/2)) % preguntas.length]
          : respuestas[(preguntaIdx + Math.floor(j/2)) % respuestas.length],
        createdAt: msgTime,
      });
    }

    await prisma.chatMessage.createMany({
      data: messages.map(m => ({
        conversationId: conversation.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
    });

    const customerInfo = customer ? `${customer.firstName} ${customer.lastName}` : 'Anónimo';
    console.log(`✅ Conversación ${i + 1}: ${customerInfo} (${numMessages} msgs)`);
  }

  // Resumen
  const totalConvs = await prisma.conversation.count();
  const totalMsgs = await prisma.chatMessage.count();
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Seed completado:`);
  console.log(`   - ${totalConvs} Conversaciones`);
  console.log(`   - ${totalMsgs} Mensajes`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
