// src/lib/sanity/testimonials.service.ts
/**
 * TESTIMONIALS SERVICE - Carga "Casos de Éxito" desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

export interface TestimonialItem {
  _key?: string;
  name: string;
  text: string;
  location?: string;
  visa?: string;
  rating?: number;
}

export interface TestimonialsData {
  title: string;
  subtitle?: string;
  items: TestimonialItem[];
}

// Query: busca la sección testimonials dentro de la página home
const TESTIMONIALS_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "testimonials"][0]{
  title,
  subtitle,
  items[]{ _key, name, text, location, visa, rating }
}`;

// Fallback estático
const FALLBACK_TESTIMONIALS: TestimonialsData = {
  title: 'Casos de Éxito',
  subtitle: 'Miles de ecuatorianos han confiado en nuestro servicio. Estas son sus historias.',
  items: [
    {
      name: 'María García',
      location: 'Quito',
      visa: 'Visa EE.UU',
      text: 'Excelente servicio. Me ayudaron con todo el proceso del DS-160 y la preparación para la entrevista. ¡Aprobada a la primera!',
      rating: 5,
    },
    {
      name: 'Carlos Mendoza',
      location: 'Guayaquil',
      visa: 'Visa Canadá',
      text: 'Muy profesionales. Revisaron todos mis documentos y me dieron consejos muy útiles. Recomendado 100%.',
      rating: 5,
    },
    {
      name: 'Ana Rodríguez',
      location: 'Cuenca',
      visa: 'Visa Schengen',
      text: 'Tenía muchas dudas sobre el proceso para Europa y me explicaron todo paso a paso. Servicio de primera.',
      rating: 5,
    },
  ],
};

/**
 * Obtiene Testimonials desde Sanity con fallback
 */
export async function getTestimonials(): Promise<TestimonialsData> {
  try {
    const data = await sanityFetch<TestimonialsData | null>(TESTIMONIALS_QUERY);
    
    if (data?.items?.length) {
      console.log('[Sanity] Testimonials cargado desde CMS');
      return data;
    }
    
    return FALLBACK_TESTIMONIALS;
  } catch (error) {
    console.log('[Sanity] Testimonials usando fallback');
    return FALLBACK_TESTIMONIALS;
  }
}
