/**
 * Seed de Customers y Solicitudes
 * Ejecutar: pnpm exec tsx scripts/seed-customers.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/server/db/prisma-singleton';

const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofía', 'Miguel', 'Valentina', 'Andrés', 'Camila', 'José', 'Isabella', 'Luis', 'Daniela', 'Fernando', 'Gabriela', 'Ricardo', 'Paula'];
const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales', 'Jiménez', 'Ruiz', 'Álvarez', 'Romero'];
const ciudades = ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Portoviejo', 'Machala', 'Loja', 'Riobamba', 'Esmeraldas'];
const sources = ['WEB', 'WHATSAPP', 'REFERIDO', 'SOCIAL', 'ADS'];
const statuses = ['LEAD', 'ACTIVE', 'LEAD', 'ACTIVE', 'LEAD']; // Más leads que activos
const visaTypes = ['USA_TURISMO', 'USA_TURISMO', 'CANADA_VISITANTE', 'SCHENGEN', 'USA_TURISMO'];
const solicitudStatuses = ['NUEVA', 'EN_REVISION', 'DOCUMENTOS', 'FORMULARIO', 'CITA_AGENDADA', 'ENTREVISTA', 'APROBADA'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `+593 9${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

async function main() {
  console.log('🌱 Creando 20 Customers con Solicitudes...\n');

  // Limpiar datos existentes (opcional)
  await prisma.solicitud.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log('🗑️  Datos anteriores eliminados\n');

  const customers: any[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = randomItem(nombres);
    const lastName = randomItem(apellidos);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`;
    
    const customer = await prisma.customer.create({
      data: {
        email,
        firstName,
        lastName,
        phone: randomPhone(),
        source: randomItem(sources),
        status: randomItem(statuses),
        isActive: true,
        createdAt: randomDate(90),
      }
    });
    
    customers.push(customer);
    console.log(`✅ Customer: ${firstName} ${lastName} (${customer.status})`);
  }

  console.log('\n📝 Creando Solicitudes...\n');

  // Crear solicitudes para algunos customers (70% tienen solicitud)
  for (const customer of customers) {
    if (Math.random() > 0.3) {
      const visaType = randomItem(visaTypes);
      const status = randomItem(solicitudStatuses);
      
      const solicitud = await prisma.solicitud.create({
        data: {
          customerId: customer.id,
          visaType,
          destinationCountry: visaType.includes('USA') ? 'Estados Unidos' : visaType.includes('CANADA') ? 'Canadá' : 'Europa',
          status,
          currentStep: solicitudStatuses.indexOf(status) + 1,
          totalSteps: 7,
          fullName: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          email: customer.email,
          city: randomItem(ciudades),
          travelPurpose: 'Turismo',
          source: customer.source,
          priority: Math.random() > 0.8 ? 'HIGH' : 'NORMAL',
          createdAt: randomDate(60),
        }
      });
      
      console.log(`  📄 Solicitud: ${customer.firstName} → ${visaType} (${status})`);
    }
  }

  // Resumen
  const totalCustomers = await prisma.customer.count();
  const totalSolicitudes = await prisma.solicitud.count();
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Seed completado:`);
  console.log(`   - ${totalCustomers} Customers`);
  console.log(`   - ${totalSolicitudes} Solicitudes`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
