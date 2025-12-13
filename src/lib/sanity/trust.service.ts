// src/lib/sanity/trust.service.ts
/**
 * TRUST SERVICE - Carga "¿Por qué confiar?" desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

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

// Query: busca la sección trust dentro de la página home
const TRUST_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "trust"][0]{
  title,
  subtitle,
  items[]{ _key, value, label, icon }
}`;

// Fallback estático
const FALLBACK_TRUST: TrustData = {
  title: '¿Por qué confiar en nosotros?',
  items: [
    { value: '5+', label: 'Años de experiencia' },
    { value: '2,000+', label: 'Clientes atendidos' },
    { value: '97%', label: 'Satisfacción' },
    { value: '24h', label: 'Respuesta promedio' },
  ],
};

/**
 * Obtiene Trust desde Sanity con fallback
 */
export async function getTrust(): Promise<TrustData> {
  try {
    const data = await sanityFetch<TrustData | null>(TRUST_QUERY);
    
    if (data?.items?.length) {
      console.log('[Sanity] Trust cargado desde CMS');
      return data;
    }
    
    return FALLBACK_TRUST;
  } catch (error) {
    console.log('[Sanity] Trust usando fallback');
    return FALLBACK_TRUST;
  }
}
