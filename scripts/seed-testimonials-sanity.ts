// scripts/seed-testimonials-sanity.ts
// Actualiza los testimonios de la página "Inicio - ConsigueTuVisa"

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

// Testimonios de ejemplo para ConsigueTuVisa
const TESTIMONIALS = {
  title: 'Casos de Éxito',
  items: [
    {
      _key: nanoid(),
      quote: 'Gracias a ConsigueTuVisa obtuve mi visa americana en el primer intento. La preparación para la entrevista fue clave, me sentí muy seguro.',
      author: 'Carlos Mendoza',
      role: 'Empresario - Guayaquil',
    },
    {
      _key: nanoid(),
      quote: 'Después de dos rechazos por mi cuenta, decidí buscar ayuda profesional. En 3 semanas tenía mi visa aprobada. ¡Excelente servicio!',
      author: 'María José Pérez',
      role: 'Ingeniera - Quito',
    },
    {
      _key: nanoid(),
      quote: 'El equipo me ayudó a organizar todos mis documentos y me preparó para cada pregunta. La inversión valió totalmente la pena.',
      author: 'Roberto Sánchez',
      role: 'Médico - Cuenca',
    },
    {
      _key: nanoid(),
      quote: 'Tenía miedo de la entrevista, pero la simulación que hicimos me dio mucha confianza. Aprobada a la primera.',
      author: 'Ana Lucía Torres',
      role: 'Contadora - Ambato',
    },
    {
      _key: nanoid(),
      quote: 'Profesionales, puntuales y muy conocedores del proceso. Recomiendo 100% sus servicios.',
      author: 'Fernando Vega',
      role: 'Arquitecto - Manta',
    },
  ],
};

async function seed() {
  console.log('🌱 Actualizando testimonios en Sanity...\n');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN no configurado en .env.local');
    process.exit(1);
  }

  try {
    // Buscar la página "home" o "Inicio"
    const page = await client.fetch(`*[_type == "page" && slug.current == "home"][0]{
      _id,
      title,
      sections
    }`);

    if (!page) {
      console.error('❌ No se encontró la página con slug "home"');
      console.log('   Buscando otras páginas...');
      
      const pages = await client.fetch(`*[_type == "page"]{_id, title, "slug": slug.current}`);
      console.log('   Páginas encontradas:', pages);
      process.exit(1);
    }

    console.log(`📄 Página encontrada: ${page.title} (${page._id})`);

    // Buscar el índice de la sección testimonials
    const sections = page.sections || [];
    const testimonialIndex = sections.findIndex((s: any) => s._type === 'testimonials');

    if (testimonialIndex === -1) {
      console.log('   No hay sección de testimonios, agregando una nueva...');
      
      await client
        .patch(page._id)
        .setIfMissing({ sections: [] })
        .append('sections', [{
          _type: 'testimonials',
          _key: nanoid(),
          ...TESTIMONIALS,
        }])
        .commit();
    } else {
      console.log(`   Actualizando sección de testimonios (índice ${testimonialIndex})...`);
      
      await client
        .patch(page._id)
        .set({
          [`sections[${testimonialIndex}].title`]: TESTIMONIALS.title,
          [`sections[${testimonialIndex}].items`]: TESTIMONIALS.items,
        })
        .commit();
    }

    console.log(`   ✓ ${TESTIMONIALS.items.length} testimonios agregados`);
    console.log('\n✅ Testimonios actualizados!');
    console.log('\n📝 Ahora puedes publicar desde /studio');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
