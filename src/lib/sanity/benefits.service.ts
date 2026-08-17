// src/lib/sanity/benefits.service.ts
/**
 * BENEFITS SERVICE - Carga "¿Por qué elegirnos?" desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

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

const BENEFITS_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "features"][0]{
  title, subtitle, items[]{ _key, icon, title, description }
}`;

export const FALLBACK_BENEFITS: BenefitsData = {
  title: '¿Por qué elegirnos?',
  items: [
    { icon: 'star', title: '97% Satisfacción', description: 'Miles de ecuatorianos han confiado en nuestro servicio con excelentes resultados.' },
    { icon: 'users', title: 'Asistencia Completa', description: 'Te acompañamos en todo el proceso, desde el diagnóstico hasta la cita consular.' },
    { icon: 'document', title: 'Revisión Profesional', description: 'Verificamos cada documento para evitar errores que puedan afectar tu solicitud.' },
    { icon: 'calendar', title: 'Acompañamiento', description: 'Preparación para la entrevista y acompañamiento el día de tu cita.' },
  ],
};

export const getBenefits = (): Promise<BenefitsData> =>
  withSanityFallback<BenefitsData>(BENEFITS_QUERY, FALLBACK_BENEFITS, (d) => !!d?.items?.length);
