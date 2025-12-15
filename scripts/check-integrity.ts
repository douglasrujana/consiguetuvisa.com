/**
 * Verifica integridad de datos entre todas las tablas
 * Ejecutar: pnpm exec tsx scripts/check-integrity.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

async function main() {
  console.log('🔍 VERIFICACIÓN DE INTEGRIDAD DE DATOS\n');
  console.log('='.repeat(60));

  // 1. USUARIOS LEGACY
  console.log('\n📋 1. USUARIOS LEGACY (User - deprecado)');
  const users = await prisma.user.findMany();
  console.log(`   Total: ${users.length}`);
  users.forEach(u => {
    console.log(`   - ${u.email} | rol: ${u.role} | migrado: ${u.migratedTo || 'NO'}`);
  });

  // 2. STAFF MEMBERS
  console.log('\n👔 2. STAFF MEMBERS (equipo interno)');
  const staff = await prisma.staffMember.findMany();
  console.log(`   Total: ${staff.length}`);
  staff.forEach(s => {
    console.log(`   - ${s.email} | rol: ${s.role} | clerkId: ${s.clerkId ? '✅' : '❌'} | activo: ${s.isActive}`);
  });

  // 3. CUSTOMERS
  console.log('\n👤 3. CUSTOMERS (clientes externos)');
  const customers = await prisma.customer.findMany();
  console.log(`   Total: ${customers.length}`);
  customers.forEach(c => {
    console.log(`   - ${c.email} | status: ${c.status} | clerkId: ${c.clerkId ? '✅' : '❌'}`);
  });

  // 4. SOLICITUDES
  console.log('\n📝 4. SOLICITUDES');
  const solicitudes = await prisma.solicitud.findMany({
    include: { customer: true, assignedAgent: true }
  });
  console.log(`   Total: ${solicitudes.length}`);
  solicitudes.forEach(s => {
    console.log(`   - ${s.fullName} | visa: ${s.visaType} | status: ${s.status}`);
    console.log(`     customer: ${s.customer?.email || '❌ SIN CUSTOMER'}`);
    console.log(`     agente: ${s.assignedAgent?.email || 'sin asignar'}`);
  });

  // 5. CONVERSATIONS
  console.log('\n💬 5. CONVERSATIONS');
  const conversations = await prisma.conversation.findMany({
    include: { customer: true, _count: { select: { messages: true } } }
  });
  console.log(`   Total: ${conversations.length}`);
  conversations.forEach(c => {
    console.log(`   - ${c.title || 'Sin título'} | msgs: ${c._count.messages} | customer: ${c.customer?.email || 'anónimo'}`);
  });

  // 6. KNOWLEDGE BASE
  console.log('\n📚 6. KNOWLEDGE BASE');
  const sources = await prisma.source.findMany({
    include: { _count: { select: { kbDocuments: true } } }
  });
  console.log(`   Sources: ${sources.length}`);
  sources.forEach(s => {
    console.log(`   - ${s.name} | tipo: ${s.type} | docs: ${s._count.kbDocuments}`);
  });

  const docs = await prisma.kBDocument.count();
  const chunks = await prisma.chunk.count();
  const embeddings = await prisma.embedding.count();
  console.log(`   Documents: ${docs}`);
  console.log(`   Chunks: ${chunks}`);
  console.log(`   Embeddings: ${embeddings}`);

  // 7. ALERTS
  console.log('\n🚨 7. ALERTS');
  const alerts = await prisma.alert.findMany({
    include: { createdBy: true, acknowledgedBy: true }
  });
  console.log(`   Total: ${alerts.length}`);
  alerts.forEach(a => {
    console.log(`   - ${a.title} | tipo: ${a.type} | prioridad: ${a.priority}`);
    console.log(`     creador: ${a.createdBy?.email || 'sistema'} | ack: ${a.acknowledgedBy?.email || 'pendiente'}`);
  });

  // 8. DOCUMENTS (archivos)
  console.log('\n📎 8. DOCUMENTS (archivos de solicitudes)');
  const documents = await prisma.document.findMany({
    include: { customer: true, reviewedBy: true }
  });
  console.log(`   Total: ${documents.length}`);

  // 9. NOTES
  console.log('\n📝 9. NOTES');
  const notes = await prisma.note.findMany({
    include: { createdBy: true, customer: true }
  });
  console.log(`   Total: ${notes.length}`);

  // 10. VERIFICAR RELACIONES ROTAS
  console.log('\n⚠️  10. VERIFICACIÓN DE RELACIONES ROTAS');
  
  // Solicitudes sin customer válido
  const solicitudesSinCustomer = await prisma.solicitud.findMany({
    where: { customer: null }
  });
  if (solicitudesSinCustomer.length > 0) {
    console.log(`   ❌ Solicitudes sin customer: ${solicitudesSinCustomer.length}`);
  } else {
    console.log(`   ✅ Todas las solicitudes tienen customer`);
  }

  // Conversations con customerId que no existe
  const convsSinCustomer = await prisma.conversation.findMany({
    where: { 
      customerId: { not: null },
      customer: null 
    }
  });
  if (convsSinCustomer.length > 0) {
    console.log(`   ❌ Conversations con customerId inválido: ${convsSinCustomer.length}`);
  } else {
    console.log(`   ✅ Todas las conversations tienen customer válido o son anónimas`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verificación completada');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
