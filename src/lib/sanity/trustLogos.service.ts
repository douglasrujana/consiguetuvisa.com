// src/lib/sanity/trustLogos.service.ts
/**
 * TRUST LOGOS SERVICE - Carga logos de confianza desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

export interface TrustLogoItem {
  _key?: string;
  name: string;
  logoUrl?: string;
}

export interface TrustLogosData {
  items: TrustLogoItem[];
}

const TRUST_LOGOS_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "trustLogos"][0]{
  items[]{ _key, name, logoUrl }
}`;

// Fallback vacío: si no hay logos configurados, no se muestra la sección
export const FALLBACK_TRUST_LOGOS: TrustLogosData = { items: [] };

export const getTrustLogos = (): Promise<TrustLogosData> =>
  withSanityFallback<TrustLogosData>(TRUST_LOGOS_QUERY, FALLBACK_TRUST_LOGOS, (d) => !!d?.items?.length);
