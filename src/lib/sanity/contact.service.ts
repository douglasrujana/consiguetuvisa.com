// src/lib/sanity/contact.service.ts
/**
 * CONTACT SERVICE - Carga sección de contacto desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

export interface ContactData {
  title: string;
  subtitle?: string;
  formType?: string;
  buttonText?: string;
}

const CONTACT_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "contact"][0]{
  title, subtitle, formType, buttonText
}`;

export const FALLBACK_CONTACT: ContactData = {
  title: 'Agenda tu Evaluación Gratuita',
  subtitle: 'Cuéntanos sobre tu caso y te contactaremos en menos de 24 horas.',
  formType: 'evaluation',
  buttonText: 'Solicitar Evaluación Gratuita',
};

export const getContact = (): Promise<ContactData> =>
  withSanityFallback<ContactData>(CONTACT_QUERY, FALLBACK_CONTACT, (d) => !!d?.title);
