// src/server/lib/features/knowledge/Document.port.ts

/**
 * PORTS - Document
 * Interfaces para el repositorio de documentos.
 */

import type { Document, CreateDocumentInput, UpdateDocumentInput, DocumentStatus } from './Document.entity';

/**
 * Interface del repositorio de Documents
 */
export interface IDocumentRepository {
  /**
   * Crea un nuevo documento
   */
  create(input: CreateDocumentInput & { contentHash: string }): Promise<Document>;

  /**
   * Obtiene un documento por ID
   */
  findById(id: string): Promise<Document | null>;

  /**
   * Obtiene un documento por sourceId y externalId
   */
  findByExternalId(sourceId: string, externalId: string): Promise<Document | null>;

  /**
   * Obtiene documentos por sourceId
   */
  findBySourceId(sourceId: string): Promise<Document[]>;

  /**
   * Obtiene documentos por estado
   */
  findByStatus(status: DocumentStatus): Promise<Document[]>;

  /**
   * Busca documento por contentHash (para detectar duplicados)
   */
  findByContentHash(contentHash: string): Promise<Document | null>;

  /**
   * Actualiza un documento
   */
  update(id: string, input: UpdateDocumentInput): Promise<Document>;

  /**
   * Actualiza el hash de contenido
   */
  updateContentHash(id: string, contentHash: string): Promise<Document>;

  /**
   * Marca un documento como indexado
   */
  markIndexed(id: string): Promise<Document>;

  /**
   * Marca un documento como fallido
   */
  markFailed(id: string): Promise<Document>;

  /**
   * Elimina un documento (cascade elimina chunks y embeddings)
   */
  delete(id: string): Promise<void>;

  /**
   * Elimina todos los documentos de una fuente
   */
  deleteBySourceId(sourceId: string): Promise<number>;
}
