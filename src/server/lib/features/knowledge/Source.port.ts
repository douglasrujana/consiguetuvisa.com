// src/server/lib/features/knowledge/Source.port.ts

/**
 * PORTS - Source
 * Interfaces para el repositorio de fuentes de datos.
 */

import type { Source, CreateSourceInput, UpdateSourceInput, SourceType } from './Source.entity';

/**
 * Interface del repositorio de Sources
 */
export interface ISourceRepository {
  /**
   * Crea una nueva fuente de datos
   */
  create(input: CreateSourceInput): Promise<Source>;

  /**
   * Obtiene una fuente por ID
   */
  findById(id: string): Promise<Source | null>;

  /**
   * Obtiene todas las fuentes
   */
  findAll(): Promise<Source[]>;

  /**
   * Obtiene fuentes por tipo
   */
  findByType(type: SourceType): Promise<Source[]>;

  /**
   * Obtiene fuentes activas
   */
  findActive(): Promise<Source[]>;

  /**
   * Actualiza una fuente
   */
  update(id: string, input: UpdateSourceInput): Promise<Source>;

  /**
   * Actualiza la fecha de última sincronización
   */
  updateLastSyncAt(id: string): Promise<void>;

  /**
   * Elimina una fuente
   */
  delete(id: string): Promise<void>;

  /**
   * Desactiva una fuente (soft delete)
   */
  deactivate(id: string): Promise<Source>;
}
