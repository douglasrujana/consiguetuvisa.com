// src/lib/sanity/benefits.service.ts
/**
 * BENEFITS SERVICE - Carga "¿Por qué elegirnos?" desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

export interface BenefitItem {
  _key?: string;
  icon?: string;
  title: string;
  description: string;
}

export interface BenefitsData {
  title: string;
  subtitle?: string;
  items: BenefitItem[];
}

// Query: busca la sección features dentro de la página home
const BENEFITS_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "features"][0]{
  title,
  subtitle,
  items[]{ _key, icon, title, description }
}`;

// Fallback estático
const FALLBACK_BENEFITS: BenefitsData = {
  title: '¿Por qué elegirnos?',
  items: [
    {
      icon: 'star',
      title: '97% Satisfacción',
      description: 'Miles de ecuatorianos han confiado en nuestro servicio con excelentes resultados.',
    },
    {
      icon: 'users',
      title: 'Asistencia Completa',
      description: 'Te acompañamos en todo el proceso, desde el diagnóstico hasta la cita consular.',
    },
    {
      icon: 'document',
      title: 'Revisión Profesional',
      description: 'Verificamos cada documento para evitar errores que puedan afectar tu solicitud.',
    },
    {
      icon: 'calendar',
      title: 'Acompañamiento',
      description: 'Preparación para la entrevista y acompañamiento el día de tu cita.',
    },
  ],
};

/**
 * Obtiene Benefits desde Sanity con fallback
 */
export async function getBenefits(): Promise<BenefitsData> {
  try {
    const data = await sanityFetch<BenefitsData | null>(BENEFITS_QUERY);
    
    if (data?.items?.length) {
      console.log('[Sanity] Benefits cargado desde CMS');
      return data;
    }
    
    return FALLBACK_BENEFITS;
  } catch (error) {
    console.log('[Sanity] Benefits usando fallback');
    return FALLBACK_BENEFITS;
  }
}
