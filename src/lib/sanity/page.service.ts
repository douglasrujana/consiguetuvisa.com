// src/lib/sanity/page.service.ts
/**
 * PAGE SERVICE - Carga páginas desde Sanity con fallback
 * Si Sanity falla, usa contenido estático local.
 */

import { getSanityClient } from '@server/lib/adapters/cms/sanity.client';
import type { PageSection } from '@server/lib/features/page/Page.entity';

// Tipos
export interface SanityPage {
  _id: string;
  title: string;
  slug: string;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: { asset: { url: string } };
  };
  sections: PageSection[];
}

export interface SiteSettings {
  siteName: string;
  homePage?: SanityPage;
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
}

// Queries GROQ
const HOME_PAGE_QUERY = `
  *[_type == "siteSettings"][0]{
    siteName,
    homePage->{
      _id,
      title,
      "slug": slug.current,
      seo,
      sections[]{
        _type,
        _key,
        ...
      }
    },
    contact
  }
`;

const PAGE_BY_SLUG_QUERY = `
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    seo,
    sections[]{
      _type,
      _key,
      ...
    }
  }
`;

/**
 * Obtiene la página de inicio desde Sanity
 * Con fallback a contenido estático si falla
 */
export async function getHomePage(): Promise<SanityPage> {
  try {
    const client = getSanityClient();
    const settings = await client.fetch<SiteSettings>(HOME_PAGE_QUERY);
    
    if (settings?.homePage?.sections?.length) {
      console.log('[Sanity] Home page cargada desde CMS');
      return settings.homePage;
    }
    
    // Si no hay homePage configurada, intentar buscar por slug
    const page = await client.fetch<SanityPage>(PAGE_BY_SLUG_QUERY, { slug: 'home' });
    
    if (page?.sections?.length) {
      console.log('[Sanity] Home page cargada por slug');
      return page;
    }
    
    throw new Error('No home page found in Sanity');
  } catch (error) {
    console.warn('[Sanity] Fallback activado:', (error as Error).message);
    return getFallbackHomePage();
  }
}

/**
 * Obtiene una página por slug
 */
export async function getPageBySlug(slug: string): Promise<SanityPage | null> {
  try {
    const client = getSanityClient();
    const page = await client.fetch<SanityPage>(PAGE_BY_SLUG_QUERY, { slug });
    return page;
  } catch (error) {
    console.warn('[Sanity] Error fetching page:', slug, (error as Error).message);
    return null;
  }
}

/**
 * Obtiene configuración del sitio
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const client = getSanityClient();
    return await client.fetch<SiteSettings>(`*[_type == "siteSettings"][0]`);
  } catch (error) {
    console.warn('[Sanity] Error fetching settings:', (error as Error).message);
    return null;
  }
}

/**
 * Fallback: Contenido estático del home
 * Se usa cuando Sanity no está disponible
 */
function getFallbackHomePage(): SanityPage {
  return {
    _id: 'fallback-home',
    title: 'ConsigueTuVisa - Asesoría de Visas',
    slug: 'home',
    seo: {
      title: 'ConsigueTuVisa - Asesoría Profesional para Visas de Turismo',
      description: 'Te ayudamos a obtener tu visa de turista para USA, Canadá, Europa y más. Asesoría personalizada y profesional.',
    },
    sections: [
      {
        _type: 'hero',
        _key: 'hero-1',
        title: 'Tu Visa, Nuestra Misión',
        subtitle: 'Asesoría profesional para trámites de visa a Estados Unidos, Canadá y Europa',
        cta: { text: 'Agenda tu Asesoría', link: '#contacto' },
      },
      {
        _type: 'features',
        _key: 'features-1',
        title: '¿Por qué elegirnos?',
        items: [
          { title: 'Experiencia', description: 'Más de 10 años ayudando a obtener visas' },
          { title: 'Personalizado', description: 'Cada caso es único, te damos atención individual' },
          { title: 'Resultados', description: 'Alto índice de aprobación de visas' },
        ],
      },
      {
        _type: 'testimonials',
        _key: 'testimonials-1',
        title: 'Lo que dicen nuestros clientes',
        items: [
          { name: 'María G.', text: 'Excelente servicio, obtuve mi visa a la primera', rating: 5 },
          { name: 'Carlos R.', text: 'Muy profesionales y atentos', rating: 5 },
        ],
      },
      {
        _type: 'cta',
        _key: 'cta-1',
        title: '¿Listo para tu visa?',
        subtitle: 'Contáctanos hoy y comienza tu proceso',
        buttonText: 'Contactar',
        buttonLink: '#contacto',
      },
    ] as PageSection[],
  };
}
