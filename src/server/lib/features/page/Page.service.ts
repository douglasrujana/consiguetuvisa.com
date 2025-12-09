// src/server/lib/features/page/Page.service.ts

/**
 * SERVICIO DE PAGE - Lógica de Negocio
 * Orquesta las operaciones del dominio Page.
 */

import type { IPageRepository } from './Page.port';
import type { Page, PageSummary } from './Page.entity';
import { GetPageBySlugSchema, ListPagesSchema } from './Page.dto';
import { NotFoundError } from '@core/error/Domain.error';

export class PageService {
  constructor(private readonly pageRepository: IPageRepository) {}

  /**
   * Obtiene una página por slug
   * @throws NotFoundError si no existe
   */
  async getPageBySlug(slug: string): Promise<Page> {
    const validated = GetPageBySlugSchema.parse({ slug });
    
    const page = await this.pageRepository.findBySlug(validated.slug);
    
    if (!page) {
      throw new NotFoundError(`Página '${slug}' no encontrada`);
    }
    
    return page;
  }

  /**
   * Obtiene una página por slug (nullable)
   */
  async findPageBySlug(slug: string): Promise<Page | null> {
    const validated = GetPageBySlugSchema.parse({ slug });
    return this.pageRepository.findBySlug(validated.slug);
  }

  /**
   * Lista todas las páginas
   */
  async listPages(options?: { limit?: number; offset?: number }): Promise<PageSummary[]> {
    const validated = ListPagesSchema.parse(options ?? {});
    return this.pageRepository.findAll(validated);
  }

  /**
   * Verifica si existe una página
   */
  async pageExists(slug: string): Promise<boolean> {
    return this.pageRepository.exists(slug);
  }
}
