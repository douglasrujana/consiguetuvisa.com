// src/lib/sanity/faq.service.ts
/**
 * FAQ SERVICE - Carga FAQ desde Sanity (sección dentro de página home)
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

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

// Query: busca la sección FAQ dentro de la página home
const FAQ_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "faq"][0]{
  title,
  subtitle,
  items[]{ _key, question, answer }
}`;

// Fallback estático
const FALLBACK_FAQ: FAQData = {
  title: 'Preguntas Frecuentes',
  subtitle: 'Resolvemos tus dudas más comunes sobre nuestro servicio.',
  items: [
    {
      question: '¿Cuánto tiempo toma el proceso de asesoría?',
      answer: 'El tiempo varía según el tipo de visa. Para EE.UU generalmente son 2-4 semanas desde la evaluación hasta la cita.',
    },
    {
      question: '¿Qué incluye la evaluación gratuita?',
      answer: 'Analizamos tu perfil, revisamos tu situación laboral y financiera, y te damos una recomendación honesta.',
    },
    {
      question: '¿Garantizan la aprobación de la visa?',
      answer: 'Ninguna empresa puede garantizar la aprobación. Lo que sí garantizamos es una preparación profesional.',
    },
    {
      question: '¿Cuánto cuesta el servicio de asesoría?',
      answer: 'Los precios varían según el tipo de visa. Agenda una evaluación gratuita para una cotización personalizada.',
    },
    {
      question: '¿Atienden fuera de Quito?',
      answer: 'Sí, atendemos a clientes de todo Ecuador. Nuestras asesorías pueden ser presenciales o virtuales.',
    },
  ],
};

export interface GetFAQOptions {
  preview?: boolean;
}

/**
 * Obtiene FAQ desde Sanity con fallback
 */
export async function getFAQ(options: GetFAQOptions = {}): Promise<FAQData> {
  try {
    const data = await sanityFetch<FAQData | null>(FAQ_QUERY, {}, { preview: options.preview });
    
    if (data?.items?.length) {
      return data;
    }
    
    return FALLBACK_FAQ;
  } catch (error) {
    console.log('[Sanity] FAQ usando fallback');
    return FALLBACK_FAQ;
  }
}
