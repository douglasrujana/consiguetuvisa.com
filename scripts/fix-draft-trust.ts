// scripts/fix-draft-trust.ts
// Pobla la sección trust en el draft

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { nanoid } from 'nanoid';

config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'zvbggttz',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const TRUST_ITEMS = [
  {
    _key: nanoid(),
    value: '500+',
    label: 'Clientes satisfechos',
    icon: 'users',
  },
  {
    _key: nanoid(),
    value: '95%',
    label: 'Tasa de aprobación',
    icon: 'trending-up',
  },
  {
    _key: nanoid(),
    value: '10+',
    label: 'Años de experiencia',
    icon: 'award',
  },
  {
    _key: nanoid(),
    value: '24/7',
    label: 'Soporte disponible',
    icon: 'headphones',
  },
];

async function fix() {
  console.log('🔧 Arreglando sección trust en draft...\n');

  const draftId = 'drafts.Flwh4UfnebAJq24oW9SL3h';
  
  // Obtener el draft
  const draft = await client.fetch(`*[_id == $id][0]{ sections }`, { id: draftId });
  
  if (!draft) {
    console.log('No hay draft, nada que arreglar');
    return;
  }

  const trustIndex = draft.sections.findIndex((s: any) => s._type === 'trust');
  
  if (trustIndex === -1) {
    console.log('No se encontró sección trust');
    return;
  }

  console.log(`Actualizando trust en índice ${trustIndex}...`);
  
  await client
    .patch(draftId)
    .set({
      [`sections[${trustIndex}].items`]: TRUST_ITEMS,
    })
    .commit();

  console.log('✅ Trust actualizado!');
}

fix();
