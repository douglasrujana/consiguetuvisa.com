// scripts/fix-duplicate-settings.ts
// Elimina duplicados de siteSettings

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

async function fix() {
  console.log('🔧 Buscando duplicados de siteSettings...\n');

  // Buscar todos los documentos siteSettings
  const docs = await client.fetch(`*[_type == "siteSettings"]{ _id }`);
  
  console.log(`Encontrados: ${docs.length} documento(s)`);
  docs.forEach((d: any) => console.log(`  - ${d._id}`));

  if (docs.length > 1) {
    // Mantener solo el que tiene _id = "siteSettings" (singleton)
    const toDelete = docs.filter((d: any) => d._id !== 'siteSettings');
    
    for (const doc of toDelete) {
      console.log(`\nEliminando: ${doc._id}`);
      await client.delete(doc._id);
    }
    
    // También eliminar drafts
    const drafts = await client.fetch(`*[_id match "drafts.siteSettings*"]{ _id }`);
    for (const draft of drafts) {
      if (draft._id !== 'drafts.siteSettings') {
        console.log(`Eliminando draft: ${draft._id}`);
        await client.delete(draft._id);
      }
    }
  }

  console.log('\n✅ Limpieza completada!');
}

fix();
