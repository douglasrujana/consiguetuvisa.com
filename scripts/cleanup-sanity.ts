// scripts/cleanup-sanity.ts
// Limpia documentos obsoletos de Sanity

import { createClient } from '@sanity/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'zvbggttz',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function cleanup() {
  console.log('🧹 Limpiando documentos obsoletos de Sanity...\n');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN no configurado');
    process.exit(1);
  }

  try {
    // Eliminar documentos faqSection (ya no usamos este tipo)
    const faqSections = await client.fetch(`*[_type == "faqSection"]._id`);
    
    if (faqSections.length > 0) {
      console.log(`📝 Eliminando ${faqSections.length} documento(s) faqSection...`);
      for (const id of faqSections) {
        await client.delete(id);
        console.log(`   ✓ Eliminado: ${id}`);
      }
    } else {
      console.log('   No hay documentos faqSection para eliminar');
    }

    console.log('\n✅ Limpieza completada!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();
