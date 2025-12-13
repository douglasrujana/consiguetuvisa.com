// scripts/check-features.ts
import { createClient } from '@sanity/client';
import { config } from 'dotenv';
config({ path: '.env.local' });

const client = createClient({
  projectId: 'zvbggttz',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

async function check() {
  const data = await client.fetch(`*[_type == "page" && slug.current == "home"][0].sections[_type == "features"][0]{ title, items }`);
  console.log(JSON.stringify(data, null, 2));
}

check();
