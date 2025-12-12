// src/server/lib/features/knowledge/Source.service.ts

/**
 * SERVICIO SOURCE - Lógica de negocio
 * Gestión de fuentes de datos para el knowledge base.
 */

import type { ISourceRepository } from './Source.port';
import type { Source, CreateSourceInput, UpdateSourceInput, SourceType } from './Source.entity';
import { validateCreateSource, validateUpdateSource } from './Source.dto';

export class SourceService {
  constructor(private repository: ISourceRepository) {}

  /**
   * Crea una nueva fuente de datos con validación
   */
  async createSource(input: unknown): Promise<Source> {
    const validatedInput = validateCreateSource(input);
    return this.repository.create(validatedInput);
  }

  /**
   * Obtiene una fuente por ID
   */
  async getSource(id: string): Promise<Source | null> {
    return this.repository.findById(id);
  }

  /**
   * Obtiene todas las fuentes
   */
  async getAllSources(): Promise<Source[]> {
    return this.repository.findAll();
  }

  /**
   * Obtiene fuentes por tipo
   */
  async getSourcesByType(type: SourceType): Promise<Source[]> {
    return this.repository.findByType(type);
  }

  /**
   * Obtiene solo fuentes activas
   */
  async getActiveSources(): Promise<Source[]> {
    return this.repository.findActive();
  }

  /**
   * Actualiza una fuente con validación
   */
  async updateSource(id: string, input: unknown): Promise<Source> {
    const validatedInput = validateUpdateSource(input);
    return this.repository.update(id, validatedInput);
  }

  /**
   * Marca la última sincronización de una fuente
   */
  async markSynced(id: string): Promise<void> {
    return this.repository.updateLastSyncAt(id);
  }

  /**
   * Desactiva una fuente (preserva documentos indexados)
   * Requirement 1.7: Deactivating a source stops ingestion but preserves content
   */
  async deactivateSource(id: string): Promise<Source> {
    return this.repository.deactivate(id);
  }

  /**
   * Activa una fuente previamente desactivada
   */
  async activateSource(id: string): Promise<Source> {
    return this.repository.update(id, { isActive: true });
  }

  /**
   * Elimina una fuente permanentemente
   * NOTA: Esto también eliminará documentos asociados por cascade
   */
  async deleteSource(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
