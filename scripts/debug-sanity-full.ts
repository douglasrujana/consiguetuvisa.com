// scripts/debug-sanity-full.ts
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

async function debug() {
  // Ver secciones con problemas
  const page = await client.fetch(`*[_type == "page" && slug.current == "home"][0]{
    sections[_type in ["services", "testimonials", "steps", "trust"]]
  }`);

  console.log('Secciones con posibles problemas:');
  console.log(JSON.stringify(page, null, 2));
}

debug();
