// scripts/seed-alerts-turso.ts
import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

config({ path: '.env.local', override: true });
config({ path: '.env.production', override: true });

const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';

function parseConnectionString(connStr: string): { url: string; authToken?: string } {
  if (connStr.includes('?authToken=')) {
    const idx = connStr.indexOf('?authToken=');
    return { url: connStr.substring(0, idx), authToken: connStr.substring(idx + 11) };
  }
  return { url: connStr, authToken: process.env.TURSO_AUTH_TOKEN };
}

async function main() {
  const { url, authToken } = parseConnectionString(TURSO_URL);
  if (!url.includes('turso.io')) {
    console.log('⚠️  No es Turso');
    return;
  }

  const client = createClient({ url, authToken });
  console.log('🌱 Seeding Alerts en Turso...\n');

  const alerts = [
    // Operations
    { domainId: 'dom_operations', type: 'SYSTEM_ERROR', priority: 'CRITICAL', title: 'Error en API de Gemini', content: 'Rate limit excedido. Revisar cuotas.' },
    { domainId: 'dom_operations', type: 'SYSTEM_ERROR', priority: 'HIGH', title: 'Latencia alta en BD', content: 'Queries tomando >2s. Revisar índices.' },
    { domainId: 'dom_operations', type: 'POLICY_CHANGE', priority: 'MEDIUM', title: 'Actualización de Clerk', content: 'Nueva versión disponible.' },
    // Business
    { domainId: 'dom_business', type: 'MENTION', priority: 'HIGH', title: 'Nueva solicitud urgente', content: 'Cliente VIP solicita visa USA.' },
    { domainId: 'dom_business', type: 'COMPLAINT', priority: 'HIGH', title: 'Queja de cliente', content: 'Cliente reporta demora en respuesta.' },
    { domainId: 'dom_business', type: 'MENTION', priority: 'LOW', title: 'Lead desde WhatsApp', content: 'Nuevo lead interesado en visa Canadá.' },
    // Social
    { domainId: 'dom_social', type: 'MENTION', priority: 'MEDIUM', title: 'Mención en Twitter', content: '@consiguetuvisa mencionado en hilo viral.' },
    { domainId: 'dom_social', type: 'COMPLAINT', priority: 'HIGH', title: 'Review negativa', content: 'Review 1 estrella en Google.' },
  ];

  for (const a of alerts) {
    const id = randomUUID();
    try {
      await client.execute({
        sql: `INSERT INTO "Alert" ("id", "type", "priority", "domainId", "title", "content", "createdAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [id, a.type, a.priority, a.domainId, a.title, a.content]
      });
      console.log(`✅ ${a.title}`);
    } catch (e: any) {
      console.log(`❌ ${a.title}: ${e.message?.substring(0, 40)}`);
    }
  }

  // Verificar
  const count = await client.execute('SELECT COUNT(*) as c FROM Alert');
  console.log(`\n📊 Total alertas: ${count.rows[0].c}`);

  client.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);
