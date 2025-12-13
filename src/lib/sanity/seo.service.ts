// src/lib/sanity/seo.service.ts
/**
 * SEO SERVICE - Carga datos SEO desde Sanity para meta tags y schema markup
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';
import { getSiteSettings, type SiteSettings } from './siteSettings.service';

export interface PageSEO {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  slug?: string;
}

export interface SEOData {
  title: string;
  description: string;
  ogImage?: string;
  siteName: string;
  siteUrl: string;
  locale: string;
  type: 'website' | 'article';
  settings: SiteSettings;
}

const PAGE_SEO_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  title,
  seoTitle,
  seoDescription,
  "ogImage": ogImage.asset->url,
  "slug": slug.current
}`;

const SITE_URL = import.meta.env.SITE_URL || 'https://consiguetuvisa.com';

/**
 * Obtiene datos SEO para una página específica
 */
export async function getPageSEO(slug: string): Promise<SEOData> {
  const settings = await getSiteSettings();
  
  try {
    const page = await sanityFetch<PageSEO | null>(PAGE_SEO_QUERY, { slug });
    
    return {
      title: page?.seoTitle || page?.title || settings.siteName || 'ConsigueTuVisa',
      description: page?.seoDescription || settings.description || 'Asesoría profesional para visas de turismo',
      ogImage: page?.ogImage,
      siteName: settings.siteName || 'ConsigueTuVisa',
      siteUrl: SITE_URL,
      locale: 'es_EC',
      type: 'website',
      settings,
    };
  } catch {
    return {
      title: settings.siteName || 'ConsigueTuVisa',
      description: settings.description || 'Asesoría profesional para visas de turismo',
      siteName: settings.siteName || 'ConsigueTuVisa',
      siteUrl: SITE_URL,
      locale: 'es_EC',
      type: 'website',
      settings,
    };
  }
}

/**
 * Obtiene datos SEO por defecto (para home y páginas sin slug)
 */
export async function getDefaultSEO(): Promise<SEOData> {
  const settings = await getSiteSettings();
  
  return {
    title: settings.siteName || 'ConsigueTuVisa',
    description: settings.description || 'Asesoría profesional para visas de turismo. EE.UU, Canadá, México, Europa y más.',
    siteName: settings.siteName || 'ConsigueTuVisa',
    siteUrl: SITE_URL,
    locale: 'es_EC',
    type: 'website',
    settings,
  };
}
