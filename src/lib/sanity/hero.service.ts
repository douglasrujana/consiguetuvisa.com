// src/lib/sanity/hero.service.ts
/**
 * HERO SERVICE - Carga Hero desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

export interface HeroData {
  badge?: string;
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  destinations?: string;
  ctaPrimaryText?: string;
  ctaPrimaryUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  trustItems?: string[];
}

// Query: busca la sección Hero dentro de la página home
const HERO_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "hero"][0]{
  badge,
  title,
  titleHighlight,
  subtitle,
  destinations,
  ctaPrimaryText,
  ctaPrimaryUrl,
  ctaSecondaryText,
  ctaSecondaryUrl,
  trustItems
}`;

// Fallback estático (contenido actual)
const FALLBACK_HERO: HeroData = {
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

/**
 * Obtiene Hero desde Sanity con fallback
 */
export async function getHero(): Promise<HeroData> {
  try {
    const data = await sanityFetch<HeroData | null>(HERO_QUERY);
    
    if (data?.title) {
      console.log('[Sanity] Hero cargado desde CMS');
      return { ...FALLBACK_HERO, ...data };
    }
    
    return FALLBACK_HERO;
  } catch (error) {
    console.log('[Sanity] Hero usando fallback');
    return FALLBACK_HERO;
  }
}
