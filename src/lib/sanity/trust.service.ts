// src/lib/sanity/trust.service.ts
/**
 * TRUST SERVICE - Carga estadísticas de confianza desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

export interface TrustItem {
  _key?: string;
  value: string;
  label: string;
  icon?: string;
}

export interface TrustData {
  title: string;
  subtitle?: string;
  items: TrustItem[];
}

const TRUST_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "trust"][0]{
  title, subtitle, items[]{ _key, value, label, icon }
}`;

export const FALLBACK_TRUST: TrustData = {
  title: '¿Por qué confiar en nosotros?',
  items: [
    { value: '5+', label: 'Años de experiencia' },
    { value: '2,000+', label: 'Clientes atendidos' },
    { value: '97%', label: 'Tasa de éxito' },
    { value: '24h', label: 'Respuesta promedio' },
  ],
};

export const getTrust = (): Promise<TrustData> =>
  withSanityFallback<TrustData>(TRUST_QUERY, FALLBACK_TRUST, (d) => !!d?.items?.length);
