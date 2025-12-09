// scripts/test-sanity.ts

/**
 * Script para probar la conexión con Sanity
 * Ejecutar: pnpm tsx scripts/test-sanity.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'zvbggttz',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function testConnection() {
  console.log('🔍 Probando conexión con Sanity...\n');
  console.log('Project ID:', process.env.SANITY_PROJECT_ID);
  console.log('Dataset:', process.env.SANITY_DATASET);
  console.log('Token:', process.env.SANITY_API_TOKEN ? '✓ Configurado' : '✗ No configurado');
  console.log('');

  try {
    // Probar query simple
    const result = await client.fetch('*[_type == "page"][0...5]');
    console.log('✅ Conexión exitosa!');
    console.log(`📄 Páginas encontradas: ${result?.length || 0}`);
    
    if (result?.length > 0) {
      console.log('\nPáginas:');
      result.forEach((page: any) => {
        console.log(`  - ${page.title} (/${page.slug?.current})`);
      });
    } else {
      console.log('\n⚠️  No hay páginas creadas aún.');
      console.log('   Abre /studio para crear tu primera landing page.');
    }
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message);
    if (error.statusCode === 401) {
      console.log('\n💡 Verifica que el SANITY_API_TOKEN sea correcto.');
    }
  }
}

testConnection();
