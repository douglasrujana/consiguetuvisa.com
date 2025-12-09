// scripts/seed-sanity.ts

/**
 * Script para crear una página de prueba en Sanity
 * Ejecutar: pnpm tsx scripts/seed-sanity.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'zvbggttz',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const testPage = {
  _type: 'page',
  title: 'Promo Black Friday',
  slug: { _type: 'slug', current: 'black-friday' },
  seo: {
    title: 'Black Friday - 50% OFF en Asesoría de Visa',
    description: 'Aprovecha nuestra promoción de Black Friday. Asesoría completa para tu visa con 50% de descuento.',
  },
  sections: [
    {
      _type: 'hero',
      _key: 'hero-1',
      title: '🔥 Black Friday 2025',
      subtitle: 'Asesoría completa para tu visa de turismo con 50% de descuento. Oferta válida solo por 48 horas.',
      ctaText: '¡Quiero esta Promo!',
      ctaUrl: 'https://wa.me/593999999999?text=Hola!%20Quiero%20la%20promo%20Black%20Friday',
    },
    {
      _type: 'features',
      _key: 'features-1',
      title: '¿Qué incluye?',
      subtitle: 'Todo lo que necesitas para conseguir tu visa',
      items: [
        {
          _key: 'f1',
          icon: '✓',
          title: 'Evaluación de tu caso',
          description: 'Analizamos tu perfil y te damos recomendaciones personalizadas.',
        },
        {
          _key: 'f2',
          icon: '✓',
          title: 'Llenado del DS-160',
          description: 'Completamos tu formulario de manera profesional.',
        },
        {
          _key: 'f3',
          icon: '✓',
          title: 'Preparación para entrevista',
          description: 'Te preparamos con las preguntas más frecuentes.',
        },
        {
          _key: 'f4',
          icon: '✓',
          title: 'Soporte WhatsApp',
          description: 'Acompañamiento ilimitado hasta tu cita.',
        },
      ],
    },
    {
      _type: 'testimonials',
      _key: 'testimonials-1',
      title: 'Lo que dicen nuestros clientes',
      items: [
        {
          _key: 't1',
          quote: 'Excelente servicio, me aprobaron la visa a la primera. Muy profesionales.',
          author: 'María González',
          role: 'Visa de Turismo USA',
        },
        {
          _key: 't2',
          quote: 'Me explicaron todo paso a paso. 100% recomendados.',
          author: 'Carlos Mendoza',
          role: 'Visa de Turismo Canadá',
        },
        {
          _key: 't3',
          quote: 'Gracias a ellos pude viajar con mi familia. Muy agradecida.',
          author: 'Ana Rodríguez',
          role: 'Visa de Turismo USA',
        },
      ],
    },
    {
      _type: 'pricing',
      _key: 'pricing-1',
      title: 'Elige tu plan',
      subtitle: 'Precios especiales solo por Black Friday',
      plans: [
        {
          _key: 'p1',
          name: 'Básico',
          price: '$49',
          description: 'Para quienes ya tienen experiencia',
          features: ['Revisión de documentos', 'Llenado DS-160', 'Soporte por email'],
          ctaText: 'Elegir Básico',
          ctaUrl: 'https://wa.me/593999999999?text=Quiero%20el%20plan%20Básico',
          highlighted: false,
        },
        {
          _key: 'p2',
          name: 'Completo',
          price: '$75',
          description: 'Nuestro más vendido',
          features: ['Todo del Básico', 'Preparación entrevista', 'Soporte WhatsApp', 'Seguimiento post-cita'],
          ctaText: 'Elegir Completo',
          ctaUrl: 'https://wa.me/593999999999?text=Quiero%20el%20plan%20Completo',
          highlighted: true,
        },
        {
          _key: 'p3',
          name: 'Premium',
          price: '$120',
          description: 'Atención VIP',
          features: ['Todo del Completo', 'Asesor dedicado', 'Simulacro de entrevista', 'Garantía de satisfacción'],
          ctaText: 'Elegir Premium',
          ctaUrl: 'https://wa.me/593999999999?text=Quiero%20el%20plan%20Premium',
          highlighted: false,
        },
      ],
    },
    {
      _type: 'faq',
      _key: 'faq-1',
      title: 'Preguntas Frecuentes',
      items: [
        {
          _key: 'q1',
          question: '¿Cuánto tiempo tarda el proceso?',
          answer: 'El proceso completo toma entre 2-4 semanas dependiendo de la disponibilidad de citas en el consulado.',
        },
        {
          _key: 'q2',
          question: '¿Qué pasa si me niegan la visa?',
          answer: 'Te asesoramos sobre los pasos a seguir y te ayudamos a preparar una nueva solicitud si es viable.',
        },
        {
          _key: 'q3',
          question: '¿Cómo es el pago?',
          answer: 'Aceptamos transferencias bancarias, tarjetas de crédito y PayPal. Puedes pagar en cuotas.',
        },
      ],
    },
    {
      _type: 'cta',
      _key: 'cta-1',
      title: '¿Listo para conseguir tu visa?',
      subtitle: 'No dejes pasar esta oportunidad. La oferta termina pronto.',
      buttonText: 'Contactar por WhatsApp',
      buttonUrl: 'https://wa.me/593999999999?text=Hola!%20Quiero%20información%20sobre%20la%20asesoría',
      variant: 'primary',
    },
  ],
  publishedAt: new Date().toISOString(),
};

async function seedPage() {
  console.log('🌱 Creando página de prueba en Sanity...\n');

  try {
    // Verificar si ya existe
    const existing = await client.fetch(
      `*[_type == "page" && slug.current == $slug][0]`,
      { slug: 'black-friday' }
    );

    if (existing) {
      console.log('⚠️  La página "black-friday" ya existe.');
      console.log(`   ID: ${existing._id}`);
      console.log('   Puedes verla en: http://localhost:3000/l/black-friday');
      return;
    }

    // Crear la página
    const result = await client.create(testPage);
    console.log('✅ Página creada exitosamente!');
    console.log(`   ID: ${result._id}`);
    console.log(`   Título: ${result.title}`);
    console.log(`   Slug: ${testPage.slug.current}`);
    console.log('\n🔗 Puedes verla en: http://localhost:3000/l/black-friday');
    console.log('📝 Edítala en: http://localhost:3000/studio');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

seedPage();
