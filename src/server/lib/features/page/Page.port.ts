// src/server/lib/features/page/Page.port.ts

/**
 * PUERTO (INTERFACE) DEL REPOSITORY DE PAGE
 * Define el contrato que debe cumplir cualquier implementación.
 * Permite cambiar de Sanity a otro CMS sin tocar el servicio.
 */

import type { Page, PageSummary } from './Page.entity';

export interface IPageRepository {
  /**
   * Obtiene una página por su slug
   */
  findBySlug(slug: string): Promise<Page | null>;

  /**
   * Lista todas las páginas (resumen)
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<PageSummary[]>;

  /**
   * Verifica si existe una página con el slug dado
   */
  exists(slug: string): Promise<boolean>;
}
