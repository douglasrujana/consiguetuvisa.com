// src/lib/sanity/faq.service.ts
/**
 * FAQ SERVICE - Carga preguntas frecuentes desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

export interface FAQItem {
  _key?: string;
  question: string;
  answer: string;
}

export interface FAQData {
  title: string;
  subtitle?: string;
  items: FAQItem[];
}

const FAQ_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "faq"][0]{
  title, subtitle, items[]{ _key, question, answer }
}`;

export const FALLBACK_FAQ: FAQData = {
  title: 'Preguntas Frecuentes',
  subtitle: 'Resolvemos tus dudas más comunes sobre nuestro servicio.',
  items: [
    { question: '¿Cuánto tiempo toma el proceso de asesoría?', answer: 'El tiempo varía según el tipo de visa. Para EE.UU generalmente son 2-4 semanas desde la evaluación hasta la cita.' },
    { question: '¿Qué incluye la evaluación gratuita?', answer: 'Analizamos tu perfil, revisamos tu situación laboral y financiera, y te damos una recomendación honesta sobre tus posibilidades.' },
    { question: '¿Garantizan la aprobación de la visa?', answer: 'Ninguna empresa puede garantizar la aprobación ya que la decisión final la toma el consulado. Lo que sí garantizamos es una preparación profesional y completa.' },
    { question: '¿Cuánto cuesta el servicio de asesoría?', answer: 'Los precios varían según el tipo de visa. Agenda una evaluación gratuita para una cotización personalizada sin compromiso.' },
    { question: '¿Atienden fuera de Quito?', answer: 'Sí, atendemos a clientes de todo Ecuador. Nuestras asesorías pueden ser presenciales o virtuales vía videollamada.' },
  ],
};

export const getFAQ = (): Promise<FAQData> =>
  withSanityFallback<FAQData>(FAQ_QUERY, FALLBACK_FAQ, (d) => !!d?.items?.length);
