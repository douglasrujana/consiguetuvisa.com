// scripts/seed-turso.ts
// Poblar Turso con datos de prueba
// Uso: pnpm exec tsx scripts/seed-turso.ts

import { config } from 'dotenv';
import { createClient } from '@libsql/client';

config({ path: '.env.local', override: true });

const TURSO_URL = process.env.DATABASE_URL || '';

function parseConnectionString(connStr: string): { url: string; authToken?: string } {
  if (connStr.includes('?authToken=')) {
    const idx = connStr.indexOf('?authToken=');
    return { url: connStr.substring(0, idx), authToken: connStr.substring(idx + 11) };
  }
  return { url: connStr, authToken: process.env.TURSO_AUTH_TOKEN };
}

// Datos de prueba
const customers = [
  { firstName: 'María', lastName: 'González', email: 'maria.gonzalez@email.com', phone: '+593987654321', source: 'web', status: 'ACTIVE' },
  { firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos.rodriguez@email.com', phone: '+593912345678', source: 'referral', status: 'ACTIVE' },
  { firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@email.com', phone: '+593998765432', source: 'social', status: 'LEAD' },
  { firstName: 'Luis', lastName: 'Pérez', email: 'luis.perez@email.com', phone: '+593923456789', source: 'ads', status: 'ACTIVE' },
  { firstName: 'Carmen', lastName: 'López', email: 'carmen.lopez@email.com', phone: '+593934567890', source: 'web', status: 'LEAD' },
  { firstName: 'Jorge', lastName: 'Sánchez', email: 'jorge.sanchez@email.com', phone: '+593945678901', source: 'whatsapp', status: 'ACTIVE' },
  { firstName: 'Patricia', lastName: 'Ramírez', email: 'patricia.ramirez@email.com', phone: '+593956789012', source: 'referral', status: 'INACTIVE' },
  { firstName: 'Roberto', lastName: 'Torres', email: 'roberto.torres@email.com', phone: '+593967890123', source: 'web', status: 'ACTIVE' },
  { firstName: 'Lucía', lastName: 'Flores', email: 'lucia.flores@email.com', phone: '+593978901234', source: 'social', status: 'LEAD' },
  { firstName: 'Miguel', lastName: 'García', email: 'miguel.garcia@email.com', phone: '+593989012345', source: 'ads', status: 'ACTIVE' },
  { firstName: 'Elena', lastName: 'Herrera', email: 'elena.herrera@email.com', phone: '+593990123456', source: 'web', status: 'LEAD' },
  { firstName: 'Fernando', lastName: 'Díaz', email: 'fernando.diaz@email.com', phone: '+593901234567', source: 'referral', status: 'ACTIVE' },
  { firstName: 'Sofía', lastName: 'Moreno', email: 'sofia.moreno@email.com', phone: '+593912345670', source: 'whatsapp', status: 'ACTIVE' },
  { firstName: 'Andrés', lastName: 'Jiménez', email: 'andres.jimenez@email.com', phone: '+593923456780', source: 'web', status: 'INACTIVE' },
  { firstName: 'Valentina', lastName: 'Ruiz', email: 'valentina.ruiz@email.com', phone: '+593934567801', source: 'social', status: 'LEAD' },
  { firstName: 'Diego', lastName: 'Vargas', email: 'diego.vargas@email.com', phone: '+593945678012', source: 'ads', status: 'ACTIVE' },
  { firstName: 'Isabella', lastName: 'Castro', email: 'isabella.castro@email.com', phone: '+593956780123', source: 'referral', status: 'ACTIVE' },
  { firstName: 'Sebastián', lastName: 'Ortiz', email: 'sebastian.ortiz@email.com', phone: '+593967801234', source: 'web', status: 'LEAD' },
  { firstName: 'Camila', lastName: 'Mendoza', email: 'camila.mendoza@email.com', phone: '+593978012345', source: 'whatsapp', status: 'ACTIVE' },
  { firstName: 'Mateo', lastName: 'Reyes', email: 'mateo.reyes@email.com', phone: '+593989123456', source: 'social', status: 'ACTIVE' },
];

const visaTypes = ['USA_B1B2', 'CANADA_TURISMO', 'SCHENGEN', 'UK_VISITOR', 'MEXICO'];
const statuses = ['NUEVA', 'EN_PROCESO', 'DOCUMENTOS', 'CITA_AGENDADA', 'APROBADA', 'RECHAZADA'];

async function main() {
  console.log('🌱 Poblando Turso con datos de prueba...\n');

  const { url, authToken } = parseConnectionString(TURSO_URL);
  const client = createClient({ url, authToken });

  // 1. Crear Customers
  console.log('👥 Creando 20 Customers...');
  const customerIds: string[] = [];
  
  for (const c of customers) {
    const id = crypto.randomUUID();
    customerIds.push(id);
    
    try {
      await client.execute({
        sql: `INSERT INTO Customer (id, firstName, lastName, email, phone, source, status, isActive, emailVerified, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))`,
        args: [id, c.firstName, c.lastName, c.email, c.phone, c.source, c.status]
      });
      console.log(`   ✅ ${c.firstName} ${c.lastName}`);
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        console.log(`   ⏭️  ${c.email} (ya existe)`);
      } else {
        console.log(`   ❌ ${c.email}: ${e.message}`);
      }
    }
  }

  // 2. Crear Solicitudes (14 solicitudes para algunos clientes)
  console.log('\n📋 Creando Solicitudes...');
  
  // Primero obtener los IDs reales de los customers creados
  const existingCustomers = await client.execute('SELECT id, email FROM Customer');
  const customerIdMap = new Map(existingCustomers.rows.map(r => [r.email as string, r.id as string]));
  
  // Crear Users dummy para satisfacer la FK (schema viejo de Turso)
  console.log('   Creando Users dummy para FK...');
  for (const [email, customerId] of customerIdMap) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO User (id, email, role, createdAt, updatedAt) VALUES (?, ?, 'USER', datetime('now'), datetime('now'))`,
        args: [customerId, email]
      });
    } catch (e) {
      // Ignorar errores
    }
  }
  
  for (let i = 0; i < 14; i++) {
    const customer = customers[i % customers.length];
    const customerId = customerIdMap.get(customer.email) || crypto.randomUUID();
    const visaType = visaTypes[i % visaTypes.length];
    const status = statuses[i % statuses.length];
    const id = crypto.randomUUID();
    
    try {
      // Incluir userId para compatibilidad con schema viejo de Turso
      await client.execute({
        sql: `INSERT INTO Solicitud (id, userId, customerId, visaType, destinationCountry, status, currentStep, totalSteps, fullName, phone, email, priority, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, 5, ?, ?, ?, 'NORMAL', datetime('now', '-' || ? || ' days'), datetime('now'))`,
        args: [id, customerId, customerId, visaType, visaType.split('_')[0], status, Math.floor(Math.random() * 5) + 1, 
               `${customer.firstName} ${customer.lastName}`, customer.phone, customer.email, Math.floor(Math.random() * 30)]
      });
      console.log(`   ✅ Solicitud ${visaType} - ${status}`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  // 3. Crear Conversaciones
  console.log('\n💬 Creando Conversaciones...');
  
  for (let i = 0; i < 10; i++) {
    const customerId = customerIds[i];
    const convId = crypto.randomUUID();
    
    try {
      await client.execute({
        sql: `INSERT INTO Conversation (id, customerId, title, createdAt, updatedAt)
              VALUES (?, ?, ?, datetime('now', '-' || ? || ' hours'), datetime('now'))`,
        args: [convId, customerId, `Consulta sobre visa ${visaTypes[i % visaTypes.length]}`, Math.floor(Math.random() * 72)]
      });
      
      // Agregar mensajes
      for (let j = 0; j < 3; j++) {
        const msgId = crypto.randomUUID();
        const role = j % 2 === 0 ? 'user' : 'assistant';
        const content = role === 'user' 
          ? '¿Cuáles son los requisitos para la visa?' 
          : 'Los requisitos principales son: pasaporte vigente, formulario DS-160, foto, y comprobante de solvencia económica.';
        
        await client.execute({
          sql: `INSERT INTO ChatMessage (id, conversationId, role, content, createdAt)
                VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' minutes'))`,
          args: [msgId, convId, role, content, (3 - j) * 5]
        });
      }
      
      console.log(`   ✅ Conversación con ${customers[i].firstName}`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  // Verificar conteos
  console.log('\n📊 Verificando datos...');
  
  const counts = await Promise.all([
    client.execute('SELECT COUNT(*) as count FROM Customer'),
    client.execute('SELECT COUNT(*) as count FROM Solicitud'),
    client.execute('SELECT COUNT(*) as count FROM Conversation'),
    client.execute('SELECT COUNT(*) as count FROM ChatMessage'),
    client.execute('SELECT COUNT(*) as count FROM StaffMember'),
  ]);

  console.log(`   Customers: ${counts[0].rows[0].count}`);
  console.log(`   Solicitudes: ${counts[1].rows[0].count}`);
  console.log(`   Conversaciones: ${counts[2].rows[0].count}`);
  console.log(`   Mensajes: ${counts[3].rows[0].count}`);
  console.log(`   Staff: ${counts[4].rows[0].count}`);

  client.close();
  console.log('\n🎉 Seed completado!');
}

main().catch(console.error);
