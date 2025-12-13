// src/lib/sanity/contact.service.ts
/**
 * CONTACT SERVICE - Carga sección Contact desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

export interface ContactData {
  title: string;
  subtitle?: string;
  formType?: string;
  buttonText?: string;
}

// Query: busca la sección contact dentro de la página home
const CONTACT_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "contact"][0]{
  title,
  subtitle,
  formType,
  buttonText
}`;

// Fallback
const FALLBACK_CONTACT: ContactData = {
  title: 'Agenda tu Evaluación Gratuita',
  subtitle: 'Cuéntanos sobre tu caso y te contactaremos en menos de 24 horas.',
  formType: 'evaluation',
  buttonText: 'Solicitar Evaluación Gratuita',
};

/**
 * Obtiene Contact desde Sanity con fallback
 */
export async function getContact(): Promise<ContactData> {
  try {
    const data = await sanityFetch<ContactData | null>(CONTACT_QUERY);
    
    if (data?.title) {
      console.log('[Sanity] Contact cargado desde CMS');
      return { ...FALLBACK_CONTACT, ...data };
    }
    
    return FALLBACK_CONTACT;
  } catch (error) {
    console.log('[Sanity] Contact usando fallback');
    return FALLBACK_CONTACT;
  }
}
