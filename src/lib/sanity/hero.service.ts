// src/lib/sanity/hero.service.ts
/**
 * HERO SERVICE - Carga el Hero desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

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

const HERO_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "hero"][0]{
  badge, title, titleHighlight, subtitle, destinations,
  ctaPrimaryText, ctaPrimaryUrl, ctaSecondaryText, ctaSecondaryUrl, trustItems
}`;

export const FALLBACK_HERO: HeroData = {
  badge: '97% de clientes satisfechos',
  title: 'Tu Visa de Turismo',
  titleHighlight: 'Sin Complicaciones',
  subtitle: 'Acompañamiento experto paso a paso para conseguir tu visa sin estrés y sin errores.',
  destinations: 'EE.UU | Canadá | México | Europa | Reino Unido | Schengen',
  ctaPrimaryText: 'Evaluación Gratuita',
  ctaPrimaryUrl: '#contacto',
  ctaSecondaryText: 'Escríbenos Ahora',
  ctaSecondaryUrl: 'https://wa.me/593999999999',
  trustItems: ['Revisión profesional', 'Asistencia completa', 'Acompañamiento a cita'],
};

export const getHero = (): Promise<HeroData> =>
  withSanityFallback<HeroData>(HERO_QUERY, FALLBACK_HERO, (d) => !!d?.title);
