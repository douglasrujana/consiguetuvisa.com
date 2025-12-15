// scripts/migrate-turso.ts
// Ejecuta migraciones en Turso usando @libsql/client
// Uso: pnpm exec tsx scripts/migrate-turso.ts

import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env.local explícitamente
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TURSO_URL = process.env.DATABASE_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

// Extraer URL y token del DATABASE_URL si tiene formato con authToken
function parseConnectionString(connStr: string): { url: string; authToken?: string } {
  // Formato: libsql://host?authToken=xxx
  const urlObj = new URL(connStr);
  const authToken = urlObj.searchParams.get('authToken');
  
  // Reconstruir URL sin el authToken
  urlObj.searchParams.delete('authToken');
  const cleanUrl = urlObj.toString();
  
  return { 
    url: cleanUrl, 
    authToken: authToken || TURSO_TOKEN || undefined 
  };
}

async function main() {
  console.log('🚀 Iniciando migración a Turso...\n');

  if (!TURSO_URL) {
    console.error('❌ DATABASE_URL no configurado');
    process.exit(1);
  }

  const { url, authToken } = parseConnectionString(TURSO_URL);
  
  console.log(`📡 Conectando a: ${url.substring(0, 50)}...`);
  console.log(`🔑 Token presente: ${authToken ? 'Sí (' + authToken.substring(0, 20) + '...)' : 'No'}`);

  const client = createClient({
    url,
    authToken,
  });

  // Leer el archivo SQL de migración
  // Permitir especificar archivo de migración como argumento
const migrationFile = process.argv[2] || 'turso-migration.sql';
const sqlPath = path.join(__dirname, '../prisma', migrationFile);
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Archivo prisma/turso-migration.sql no encontrado');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  // Remover comentarios de línea completa
  const sqlClean = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Dividir en statements individuales (por ;)
  const statements = sqlClean
    .split(';')
    .map(s => s.trim().replace(/\n/g, ' ').replace(/\s+/g, ' '))
    .filter(s => s.length > 5);

  console.log(`📝 ${statements.length} statements a ejecutar\n`);

  let success = 0;
  let errors = 0;

  for (const statement of statements) {
    // Saltar comentarios y líneas vacías
    if (statement.startsWith('--') || statement.length < 5) continue;
    
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      await client.execute(statement);
      console.log(`✅ ${preview}...`);
      success++;
    } catch (error: any) {
      // Ignorar errores de "ya existe"
      if (error.message?.includes('already exists') || 
          error.message?.includes('duplicate column')) {
        console.log(`⏭️  ${preview}... (ya existe)`);
      } else {
        console.error(`❌ ${preview}...`);
        console.error(`   Error: ${error.message}`);
        errors++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Exitosos: ${success}`);
  console.log(`❌ Errores: ${errors}`);
  
  // Verificar tablas creadas
  console.log('\n📊 Verificando tablas...');
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log('Tablas:', tables.rows.map(r => r.name).join(', '));

  client.close();
  console.log('\n🎉 Migración completada!');
}

main().catch(console.error);
