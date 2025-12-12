// src/server/lib/features/knowledge/Document.entity.ts

/**
 * ENTIDADES DE DOCUMENT
 * Modelos de dominio para documentos del knowledge base.
 */

import { createHash } from 'crypto';

/**
 * Estados posibles de un documento
 */
export enum DocumentStatus {
  PENDING = 'PENDING',
  INDEXED = 'INDEXED',
  FAILED = 'FAILED',
  OUTDATED = 'OUTDATED',
}

/**
 * Metadata de un documento
 */
export interface DocumentMetadata {
  author?: string;
  publishedAt?: Date;
  url?: string;
  language?: string;
  tags?: string[];
  country?: string;
  visaType?: string;
}

/**
 * Entidad Document - Documento indexado en el knowledge base
 */
export interface Document {
  id: string;
  sourceId: string;
  externalId: string;
  title: string;
  contentHash: string;
  status: DocumentStatus;
  metadata?: DocumentMetadata;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad Chunk - Fragmento de un documento
 */
export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  position: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Entidad Embedding - Vector de un chunk
 */
export interface Embedding {
  id: string;
  chunkId: string;
  vector: Float32Array;
  model: string;
  dimensions: number;
  createdAt: Date;
}

/**
 * Input para crear un documento
 */
export interface CreateDocumentInput {
  sourceId: string;
  externalId: string;
  title: string;
  content: string;
  metadata?: DocumentMetadata;
}

/**
 * Input para actualizar un documento
 */
export interface UpdateDocumentInput {
  title?: string;
  status?: DocumentStatus;
  metadata?: DocumentMetadata;
}

/**
 * Calcula el hash SHA-256 del contenido
 * Property 2: Content Hash Determinism - same content = same hash
 */
export function calculateContentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Verifica si el contenido ha cambiado comparando hashes
 */
export function hasContentChanged(newContent: string, existingHash: string): boolean {
  return calculateContentHash(newContent) !== existingHash;
}
