// scripts/check-drafts.ts
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

async function check() {
  // Buscar drafts de la página home
  const drafts = await client.fetch(`*[_id match "drafts.*" && _type == "page"]{
    _id,
    title,
    "sectionsCount": count(sections),
    "sectionTypes": sections[]._type
  }`);

  console.log('Drafts encontrados:');
  console.log(JSON.stringify(drafts, null, 2));

  // Ver el draft específico de home
  const homeDraft = await client.fetch(`*[_id == "drafts.Flwh4UfnebAJq24oW9SL3h"][0]{
    _id,
    sections[]{ _type, _key, title, items }
  }`);

  if (homeDraft) {
    console.log('\n\nDraft de Home:');
    console.log(JSON.stringify(homeDraft, null, 2));
  }
}

check();
