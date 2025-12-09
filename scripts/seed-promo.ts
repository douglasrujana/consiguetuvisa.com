// scripts/seed-promo.ts
// Seed de datos de prueba para la Ruleta Loca

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

async function seedPromo() {
  console.log('🎰 Seeding Promo data...\n');

  // 1. Crear marcas de tarjetas
  console.log('💳 Creating card brands...');
  
  const cardBrands = [
    { name: 'Visa', slug: 'visa', spinsPerCard: 1, order: 1 },
    { name: 'Mastercard', slug: 'mastercard', spinsPerCard: 1, order: 2 },
    { name: 'Diners Club', slug: 'diners', spinsPerCard: 2, order: 3 },
    { name: 'American Express', slug: 'amex', spinsPerCard: 2, order: 4 },
  ];

  const cardBrandIds: string[] = [];

  for (const card of cardBrands) {
    const existing = await client.fetch(
      `*[_type == "cardBrand" && slug.current == $slug][0]._id`,
      { slug: card.slug }
    );

    if (existing) {
      console.log(`  ✓ ${card.name} already exists`);
      cardBrandIds.push(existing);
    } else {
      const created = await client.create({
        _type: 'cardBrand',
        name: card.name,
        slug: { _type: 'slug', current: card.slug },
        spinsPerCard: card.spinsPerCard,
        countries: ['EC', 'CO', 'PE'],
        order: card.order,
        variants: [
          { name: 'Clásica', tier: 'classic', spinsBonus: 0 },
          { name: 'Gold', tier: 'gold', spinsBonus: 0 },
          { name: 'Platinum', tier: 'platinum', spinsBonus: 1 },
        ],
      });
      console.log(`  ✓ Created ${card.name}`);
      cardBrandIds.push(created._id);
    }
  }

  // 2. Crear premios
  console.log('\n🎁 Creating prizes...');

  const prizes = [
    { name: 'Viaje a Galápagos', type: 'travel', value: 1500, probability: 2, color: '#FF6B6B' },
    { name: 'Gift Card $100', type: 'giftcard', value: 100, probability: 10, color: '#4ECDC4' },
    { name: 'Gift Card $50', type: 'giftcard', value: 50, probability: 15, color: '#45B7D1' },
    { name: 'Asesoría Gratis', type: 'service', value: 0, probability: 20, color: '#96CEB4' },
    { name: 'Descuento 20%', type: 'discount', value: 0, probability: 20, color: '#FFEAA7' },
    { name: 'Sigue Participando', type: 'retry', value: 0, probability: 33, color: '#DDA0DD' },
  ];

  const prizeIds: string[] = [];

  for (const prize of prizes) {
    const existing = await client.fetch(
      `*[_type == "prize" && name == $name][0]._id`,
      { name: prize.name }
    );

    if (existing) {
      console.log(`  ✓ ${prize.name} already exists`);
      prizeIds.push(existing);
    } else {
      const created = await client.create({
        _type: 'prize',
        name: prize.name,
        type: prize.type,
        value: prize.value,
        probability: prize.probability,
        color: prize.color,
        inventory: prize.type === 'travel' ? 3 : -1,
        expirationDays: 30,
        description: `Premio: ${prize.name}`,
      });
      console.log(`  ✓ Created ${prize.name}`);
      prizeIds.push(created._id);
    }
  }

  // 3. Crear campaña de prueba
  console.log('\n🎯 Creating test campaign...');

  const campaignSlug = 'navidad-2025';
  const existingCampaign = await client.fetch(
    `*[_type == "campaign" && slug.current == $slug][0]._id`,
    { slug: campaignSlug }
  );

  if (existingCampaign) {
    console.log(`  ✓ Campaign "${campaignSlug}" already exists`);
    console.log(`\n✅ Seed complete!`);
    console.log(`\n🔗 Test URLs:`);
    console.log(`   Landing: http://localhost:3000/sorteo/${campaignSlug}`);
    console.log(`   Kiosko:  http://localhost:3000/kiosko/${campaignSlug}`);
    return;
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3); // 3 meses de vigencia

  await client.create({
    _type: 'campaign',
    name: 'Ruleta Navidad 2025',
    slug: { _type: 'slug', current: campaignSlug },
    description: '¡Gira la ruleta y gana increíbles premios esta Navidad!',
    country: 'EC',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    maxParticipationsPerEmail: 3,
    isActive: true,
    prizes: prizeIds.map(id => ({ _type: 'reference', _ref: id, _key: id })),
    cardBrands: cardBrandIds.map(id => ({ _type: 'reference', _ref: id, _key: id })),
    agencyInfo: {
      name: 'ConsigueTuVisa.com',
      address: 'Quito, Ecuador',
      phone: '+593 99 123 4567',
      whatsapp: '+593991234567',
      website: 'https://consiguetuvisa.com',
    },
    theme: {
      primaryColor: '#1e3a5f',
      secondaryColor: '#2d5be3',
    },
  });

  console.log(`  ✓ Created campaign "${campaignSlug}"`);

  console.log(`\n✅ Seed complete!`);
  console.log(`\n🔗 Test URLs:`);
  console.log(`   Landing: http://localhost:3000/sorteo/${campaignSlug}`);
  console.log(`   Kiosko:  http://localhost:3000/kiosko/${campaignSlug}`);
}

seedPromo().catch(console.error);
