// src/lib/sanity/siteSettings.service.ts
/**
 * SITE SETTINGS SERVICE - Carga configuración global desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

export interface FooterLink {
  _key?: string;
  label: string;
  href: string;
}

export interface SiteSettings {
  siteName: string;
  tagline?: string;
  description?: string;
  location?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  footerServices?: FooterLink[];
  footerCompany?: FooterLink[];
  footerLegal?: FooterLink[];
}

const SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  siteName,
  tagline,
  description,
  location,
  phone,
  email,
  whatsapp,
  address,
  facebook,
  instagram,
  tiktok,
  footerServices[]{ _key, label, href },
  footerCompany[]{ _key, label, href },
  footerLegal[]{ _key, label, href }
}`;

// Fallback
const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'ConsigueTuVisa',
  tagline: 'Asesoría profesional para visas de turismo',
  description: 'Tu trámite en manos de expertos.',
  location: 'Quito, Ecuador',
  phone: '+593 99 999 9999',
  email: 'info@consiguetuvisa.com',
  whatsapp: '593999999999',
  footerServices: [
    { label: 'Visa EE.UU', href: '#' },
    { label: 'Visa Canadá', href: '#' },
    { label: 'Visa Schengen', href: '#' },
    { label: 'Visa UK', href: '#' },
    { label: 'Visa México', href: '#' },
  ],
  footerCompany: [
    { label: 'Sobre Nosotros', href: '#' },
    { label: 'Testimonios', href: '#testimonios' },
    { label: 'Preguntas Frecuentes', href: '#faq' },
    { label: 'Contacto', href: '#contacto' },
  ],
  footerLegal: [
    { label: 'Términos y Condiciones', href: '#' },
    { label: 'Política de Privacidad', href: '#' },
    { label: 'Aviso Legal', href: '#' },
  ],
};

/**
 * Obtiene configuración del sitio desde Sanity
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const data = await sanityFetch<SiteSettings | null>(SETTINGS_QUERY);
    
    if (data?.siteName) {
      console.log('[Sanity] SiteSettings cargado desde CMS');
      return { ...FALLBACK_SETTINGS, ...data };
    }
    
    return FALLBACK_SETTINGS;
  } catch (error) {
    console.log('[Sanity] SiteSettings usando fallback');
    return FALLBACK_SETTINGS;
  }
}
