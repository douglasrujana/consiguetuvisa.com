// scripts/seed-hero-sanity.ts
// Actualiza la sección Hero en Sanity

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

const HERO_DATA = {
  badge: '97% de clientes satisfechos',
  title: 'Tu Visa de Turismo',
  titleHighlight: 'Sin Complicaciones',
  subtitle: 'Acompañamiento experto paso a paso para conseguir tu visa sin estrés y sin errores.',
  destinations: 'EE.UU | Canadá | México | Europa | Reino Unido | Schengen',
  ctaPrimaryText: 'Evaluación Gratuita',
  ctaPrimaryUrl: '#contacto',
  ctaSecondaryText: 'Escríbenos Ahora',
  ctaSecondaryUrl: 'https://wa.me/593999999999',
  trustItems: [
    'Revisión profesional',
    'Asistencia completa',
    'Acompañamiento a cita',
  ],
};

async function seed() {
  console.log('🌱 Actualizando Hero en Sanity...\n');

  // Actualizar documento publicado
  const pageId = 'Flwh4UfnebAJq24oW9SL3h';
  const draftId = `drafts.${pageId}`;

  // Obtener la página
  const page = await client.fetch(`*[_id == $id][0]{ sections }`, { id: pageId });
  
  if (!page) {
    console.error('❌ Página no encontrada');
    return;
  }

  const heroIndex = page.sections.findIndex((s: any) => s._type === 'hero');
  
  if (heroIndex === -1) {
    console.error('❌ Sección Hero no encontrada');
    return;
  }

  console.log(`📄 Actualizando Hero en índice ${heroIndex}...`);

  // Actualizar publicado
  await client
    .patch(pageId)
    .set({
      [`sections[${heroIndex}].badge`]: HERO_DATA.badge,
      [`sections[${heroIndex}].title`]: HERO_DATA.title,
      [`sections[${heroIndex}].titleHighlight`]: HERO_DATA.titleHighlight,
      [`sections[${heroIndex}].subtitle`]: HERO_DATA.subtitle,
      [`sections[${heroIndex}].destinations`]: HERO_DATA.destinations,
      [`sections[${heroIndex}].ctaPrimaryText`]: HERO_DATA.ctaPrimaryText,
      [`sections[${heroIndex}].ctaPrimaryUrl`]: HERO_DATA.ctaPrimaryUrl,
      [`sections[${heroIndex}].ctaSecondaryText`]: HERO_DATA.ctaSecondaryText,
      [`sections[${heroIndex}].ctaSecondaryUrl`]: HERO_DATA.ctaSecondaryUrl,
      [`sections[${heroIndex}].trustItems`]: HERO_DATA.trustItems,
    })
    .commit();

  console.log('   ✓ Documento publicado actualizado');

  // Actualizar draft si existe
  const draft = await client.fetch(`*[_id == $id][0]`, { id: draftId });
  
  if (draft) {
    const draftHeroIndex = draft.sections?.findIndex((s: any) => s._type === 'hero') ?? -1;
    
    if (draftHeroIndex !== -1) {
      await client
        .patch(draftId)
        .set({
          [`sections[${draftHeroIndex}].badge`]: HERO_DATA.badge,
          [`sections[${draftHeroIndex}].title`]: HERO_DATA.title,
          [`sections[${draftHeroIndex}].titleHighlight`]: HERO_DATA.titleHighlight,
          [`sections[${draftHeroIndex}].subtitle`]: HERO_DATA.subtitle,
          [`sections[${draftHeroIndex}].destinations`]: HERO_DATA.destinations,
          [`sections[${draftHeroIndex}].ctaPrimaryText`]: HERO_DATA.ctaPrimaryText,
          [`sections[${draftHeroIndex}].ctaPrimaryUrl`]: HERO_DATA.ctaPrimaryUrl,
          [`sections[${draftHeroIndex}].ctaSecondaryText`]: HERO_DATA.ctaSecondaryText,
          [`sections[${draftHeroIndex}].ctaSecondaryUrl`]: HERO_DATA.ctaSecondaryUrl,
          [`sections[${draftHeroIndex}].trustItems`]: HERO_DATA.trustItems,
        })
        .commit();
      
      console.log('   ✓ Draft actualizado');
    }
  }

  console.log('\n✅ Hero actualizado!');
  console.log('\n📝 Ahora puedes editar el Hero desde /studio');
}

seed();
