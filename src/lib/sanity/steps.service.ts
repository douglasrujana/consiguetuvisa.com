// src/lib/sanity/steps.service.ts
/**
 * STEPS SERVICE - Carga "Nuestro Proceso" desde Sanity
 */

import { sanityFetch } from '@server/lib/adapters/cms/sanity.client';

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

// Query: busca la sección steps dentro de la página home
const STEPS_QUERY = `*[_type == "page" && slug.current == "home"][0].sections[_type == "steps"][0]{
  title,
  subtitle,
  items[]{ _key, number, title, description, icon }
}`;

// Fallback estático
const FALLBACK_STEPS: StepsData = {
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

/**
 * Obtiene Steps desde Sanity con fallback
 */
export async function getSteps(): Promise<StepsData> {
  try {
    const data = await sanityFetch<StepsData | null>(STEPS_QUERY);
    
    if (data?.items?.length) {
      console.log('[Sanity] Steps cargado desde CMS');
      return data;
    }
    
    return FALLBACK_STEPS;
  } catch (error) {
    console.log('[Sanity] Steps usando fallback');
    return FALLBACK_STEPS;
  }
}
