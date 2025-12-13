// scripts/seed-faq-section.ts
// Agrega/actualiza la sección FAQ en la página home

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

const FAQ_SECTION = {
  _type: 'faq',
  _key: nanoid(),
  title: 'Preguntas Frecuentes',
  subtitle: 'Resolvemos tus dudas más comunes sobre nuestro servicio.',
  items: [
    {
      _key: nanoid(),
      question: '¿Cuánto tiempo toma el proceso de asesoría?',
      answer: 'El tiempo varía según el tipo de visa. Para EE.UU generalmente son 2-4 semanas desde la evaluación hasta la cita. Te damos un estimado personalizado en tu primera consulta.',
    },
    {
      _key: nanoid(),
      question: '¿Qué incluye la evaluación gratuita?',
      answer: 'Analizamos tu perfil, revisamos tu situación laboral y financiera, y te damos una recomendación honesta sobre tus posibilidades de aprobación.',
    },
    {
      _key: nanoid(),
      question: '¿Garantizan la aprobación de la visa?',
      answer: 'Ninguna empresa puede garantizar la aprobación, ya que la decisión final es del consulado. Lo que sí garantizamos es una preparación profesional que maximiza tus posibilidades.',
    },
    {
      _key: nanoid(),
      question: '¿Cuánto cuesta el servicio de asesoría?',
      answer: 'Los precios varían según el tipo de visa y el nivel de acompañamiento que necesites. Agenda una evaluación gratuita y te daremos una cotización personalizada.',
    },
    {
      _key: nanoid(),
      question: '¿Atienden fuera de Quito?',
      answer: 'Sí, atendemos a clientes de todo Ecuador. Nuestras asesorías pueden ser presenciales en Quito o virtuales por videollamada.',
    },
  ],
};

async function seed() {
  console.log('🌱 Actualizando sección FAQ en página home...\n');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN no configurado');
    process.exit(1);
  }

  try {
    // Buscar la página home
    const page = await client.fetch(`*[_type == "page" && slug.current == "home"][0]{
      _id,
      title,
      sections
    }`);

    if (!page) {
      console.error('❌ No se encontró la página home');
      process.exit(1);
    }

    console.log(`📄 Página: ${page.title} (${page._id})`);

    const sections = page.sections || [];
    const faqIndex = sections.findIndex((s: any) => s._type === 'faq');

    if (faqIndex === -1) {
      console.log('   Agregando nueva sección FAQ...');
      await client
        .patch(page._id)
        .setIfMissing({ sections: [] })
        .append('sections', [FAQ_SECTION])
        .commit();
    } else {
      console.log(`   Actualizando sección FAQ existente (índice ${faqIndex})...`);
      await client
        .patch(page._id)
        .set({
          [`sections[${faqIndex}]`]: { ...FAQ_SECTION, _key: sections[faqIndex]._key },
        })
        .commit();
    }

    console.log(`   ✓ ${FAQ_SECTION.items.length} preguntas configuradas`);
    console.log('\n✅ FAQ actualizado!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
