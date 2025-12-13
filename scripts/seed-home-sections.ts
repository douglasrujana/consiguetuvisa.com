// scripts/seed-home-sections.ts
// Pobla todas las secciones de la página home

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

// === SECCIONES ===

const SERVICES_SECTION = {
  _type: 'services',
  _key: nanoid(),
  title: 'Tipos de Visa',
  subtitle: 'Te ayudamos con el proceso completo para obtener tu visa.',
  items: [
    {
      _key: nanoid(),
      icon: 'passport',
      title: 'Visa de Turismo B1/B2',
      description: 'Para viajes de placer, visitas familiares o negocios temporales a Estados Unidos.',
      link: '/servicios/visa-turismo',
    },
    {
      _key: nanoid(),
      icon: 'briefcase',
      title: 'Visa de Trabajo',
      description: 'Visas H1B, L1 y otras categorías para profesionales que buscan empleo en EE.UU.',
      link: '/servicios/visa-trabajo',
    },
    {
      _key: nanoid(),
      icon: 'graduation',
      title: 'Visa de Estudiante F1',
      description: 'Para estudios universitarios, cursos de inglés y programas académicos.',
      link: '/servicios/visa-estudiante',
    },
    {
      _key: nanoid(),
      icon: 'plane',
      title: 'Visa Schengen',
      description: 'Acceso a 27 países europeos con una sola visa. Turismo y negocios.',
      link: '/servicios/visa-schengen',
    },
  ],
};

const STEPS_SECTION = {
  _type: 'steps',
  _key: nanoid(),
  title: 'Nuestro Proceso',
  subtitle: 'Un proceso simple y efectivo para obtener tu visa.',
  items: [
    {
      _key: nanoid(),
      number: 1,
      title: 'Evaluación Gratuita',
      description: 'Analizamos tu perfil y te damos una recomendación honesta sobre tus posibilidades.',
      icon: 'clipboard',
    },
    {
      _key: nanoid(),
      number: 2,
      title: 'Preparación de Documentos',
      description: 'Te guiamos en la recopilación y organización de todos los documentos necesarios.',
      icon: 'folder',
    },
    {
      _key: nanoid(),
      number: 3,
      title: 'Simulación de Entrevista',
      description: 'Practicamos las preguntas más comunes para que llegues seguro a tu cita.',
      icon: 'users',
    },
    {
      _key: nanoid(),
      number: 4,
      title: 'Acompañamiento',
      description: 'Te acompañamos durante todo el proceso hasta que tengas tu visa en mano.',
      icon: 'check-circle',
    },
  ],
};

const TRUST_SECTION = {
  _type: 'trust',
  _key: nanoid(),
  title: '¿Por qué confiar en nosotros?',
  items: [
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
  ],
};

const TESTIMONIALS_SECTION = {
  _type: 'testimonials',
  _key: nanoid(),
  title: 'Casos de Éxito',
  items: [
    {
      _key: nanoid(),
      quote: 'Gracias a ConsigueTuVisa obtuve mi visa americana en el primer intento. La preparación para la entrevista fue clave.',
      author: 'Carlos Mendoza',
      role: 'Empresario - Guayaquil',
    },
    {
      _key: nanoid(),
      quote: 'Después de dos rechazos por mi cuenta, decidí buscar ayuda profesional. En 3 semanas tenía mi visa aprobada.',
      author: 'María José Pérez',
      role: 'Ingeniera - Quito',
    },
    {
      _key: nanoid(),
      quote: 'El equipo me ayudó a organizar todos mis documentos y me preparó para cada pregunta. Totalmente recomendado.',
      author: 'Roberto Sánchez',
      role: 'Médico - Cuenca',
    },
    {
      _key: nanoid(),
      quote: 'Tenía miedo de la entrevista, pero la simulación que hicimos me dio mucha confianza. Aprobada a la primera.',
      author: 'Ana Lucía Torres',
      role: 'Contadora - Ambato',
    },
  ],
};

async function seed() {
  console.log('🌱 Poblando secciones de la página home...\n');

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
    
    // Función helper para actualizar o agregar sección
    const updateSection = async (sectionData: any, sectionName: string) => {
      const index = sections.findIndex((s: any) => s._type === sectionData._type);
      
      if (index === -1) {
        console.log(`   ➕ Agregando ${sectionName}...`);
        await client
          .patch(page._id)
          .setIfMissing({ sections: [] })
          .append('sections', [sectionData])
          .commit();
      } else {
        console.log(`   🔄 Actualizando ${sectionName} (índice ${index})...`);
        await client
          .patch(page._id)
          .set({
            [`sections[${index}]`]: { ...sectionData, _key: sections[index]._key },
          })
          .commit();
      }
    };

    // Actualizar cada sección
    await updateSection(SERVICES_SECTION, 'Tipos de Visa (services)');
    await updateSection(STEPS_SECTION, 'Nuestro Proceso (steps)');
    await updateSection(TRUST_SECTION, 'Indicadores de Confianza (trust)');
    await updateSection(TESTIMONIALS_SECTION, 'Casos de Éxito (testimonials)');

    console.log('\n✅ Todas las secciones pobladas!');
    console.log('\n📝 Ahora puedes publicar desde /studio');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
