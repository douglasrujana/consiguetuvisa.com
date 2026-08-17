// src/lib/sanity/services.service.ts
/**
 * SERVICES SERVICE - Carga "Tipos de Visa" desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

export interface ServiceItem {
  _key?: string;
  country: string;
  description?: string;
  flagCode?: string;
  link?: string;
}

export interface ServicesData {
  title: string;
  subtitle?: string;
  items: ServiceItem[];
}

const SERVICES_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "services"][0]{
  title, subtitle, items[]{ _key, country, description, flagCode, link }
}`;

export function getFlagUrl(flagCode: string): string {
  return `https://flagcdn.com/w80/${flagCode}.png`;
}

export const FALLBACK_SERVICES: ServicesData = {
  title: 'Tipos de Visa',
  subtitle: 'Escoge tu destino y agenda una asesoría personalizada con nuestros expertos.',
  items: [
    { country: 'Estados Unidos', flagCode: 'us', description: 'Visa B1/B2 de turismo y negocios. Asesoría completa para DS-160.' },
    { country: 'Canadá', flagCode: 'ca', description: 'Visa de visitante. Te ayudamos con la aplicación online.' },
    { country: 'México', flagCode: 'mx', description: 'Visa de turismo mexicana. Proceso rápido y sencillo.' },
    { country: 'Schengen', flagCode: 'eu', description: 'Acceso a 27 países europeos con una sola visa.' },
    { country: 'Reino Unido', flagCode: 'gb', description: 'Visa de visitante UK. Asesoría especializada.' },
    { country: 'Otros Destinos', flagCode: 'un', description: 'Australia, Nueva Zelanda, Japón y más.' },
  ],
};

export const getServices = (): Promise<ServicesData> =>
  withSanityFallback<ServicesData>(SERVICES_QUERY, FALLBACK_SERVICES, (d) => !!d?.items?.length);
