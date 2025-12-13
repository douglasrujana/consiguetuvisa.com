// scripts/seed-faq-sanity.ts
// Migra el contenido de FAQ a Sanity

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

const FAQ_CONTENT = {
  _type: 'faqSection',
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
  console.log('🌱 Migrando FAQ a Sanity...\n');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN no configurado');
    process.exit(1);
  }

  try {
    // Buscar si ya existe
    const existing = await client.fetch(`*[_type == "faqSection"][0]._id`);

    if (existing) {
      console.log('📝 Actualizando FAQ existente...');
      await client.patch(existing).set(FAQ_CONTENT).commit();
      console.log(`   ✓ FAQ actualizado: ${existing}`);
    } else {
      console.log('📝 Creando nuevo FAQ...');
      const result = await client.create(FAQ_CONTENT);
      console.log(`   ✓ FAQ creado: ${result._id}`);
    }

    console.log(`   ✓ ${FAQ_CONTENT.items.length} preguntas migradas`);
    console.log('\n✅ Migración completada!');
    console.log('\n📝 Ahora puedes editar el FAQ desde /studio');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
