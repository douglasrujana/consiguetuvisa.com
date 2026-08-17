// src/lib/sanity/steps.service.ts
/**
 * STEPS SERVICE - Carga "Nuestro Proceso" desde Sanity
 * Usa withSanityFallback centralizado (DRY)
 */

import { withSanityFallback } from '@server/lib/adapters/cms/sanity.client';

export interface StepItem {
  _key?: string;
  number: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface StepsData {
  title: string;
  subtitle?: string;
  items: StepItem[];
}

const STEPS_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "steps"][0]{
  title, subtitle, items[]{ _key, number, title, description, icon }
}`;

export const FALLBACK_STEPS: StepsData = {
  title: 'Nuestro Proceso',
  subtitle: 'Un proceso claro y estructurado para que obtengas tu visa sin complicaciones.',
  items: [
    { number: '01', title: 'Evaluación de Caso', description: 'Analizamos tu perfil y determinamos la mejor estrategia.', icon: 'users' },
    { number: '02', title: 'Recolección de Documentos', description: 'Te guiamos en la preparación de documentos.', icon: 'document' },
    { number: '03', title: 'Llenado de Formulario', description: 'Completamos juntos el DS-160 sin errores.', icon: 'document' },
    { number: '04', title: 'Agendamiento de Cita', description: 'Te ayudamos a conseguir la mejor fecha.', icon: 'calendar' },
    { number: '05', title: 'Preparación para Entrevista', description: 'Simulacros para tu cita consular.', icon: 'shield' },
  ],
};

export const getSteps = (): Promise<StepsData> =>
  withSanityFallback<StepsData>(STEPS_QUERY, FALLBACK_STEPS, (d) => !!d?.items?.length);
