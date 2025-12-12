// src/server/lib/core/rag/RAG.port.ts

/**
 * PUERTO RAG - Contrato para el pipeline RAG
 * Define la interfaz para Retrieval-Augmented Generation.
 */

import type { SearchResult } from './VectorStore.port';
import type { ChatMessage } from '../ai/LLM.port';

/**
 * Chunk de documento para indexar
 */
export interface DocumentChunk {
  id: string;
  content: string;
  source: string; // URL, filename, etc.
  metadata?: {
    title?: string;
    section?: string;
    page?: number;
    [key: string]: unknown;
  };
}

/**
 * Contexto recuperado para augmentar el prompt
 */
export interface RetrievedContext {
  chunks: SearchResult[];
  totalTokens: number;
}

/**
 * Respuesta del RAG
 */
export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    source: string;
    score: number;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Opciones para query RAG
 */
export interface RAGQueryOptions {
  topK?: number; // Chunks a recuperar (default: 5)
  minScore?: number; // Score mínimo (default: 0.7)
  maxTokens?: number; // Límite de tokens en respuesta
  temperature?: number; // Creatividad (default: 0.3 para RAG)
  systemPrompt?: string; // Prompt de sistema personalizado
  includeHistory?: ChatMessage[]; // Historial de conversación
}

/**
 * Contrato para el motor RAG.
 */
export interface IRAGEngine {
  /**
   * Indexa un documento (chunking + embedding + store)
   */
  indexDocument(doc: DocumentChunk): Promise<void>;

  /**
   * Indexa múltiples documentos
   */
  indexDocuments(docs: DocumentChunk[]): Promise<void>;

  /**
   * Realiza una query RAG completa (retrieve + augment + generate)
   */
  query(question: string, options?: RAGQueryOptions): Promise<RAGResponse>;

  /**
   * Solo recupera contexto relevante (sin generar respuesta)
   */
  retrieve(question: string, options?: RAGQueryOptions): Promise<RetrievedContext>;

  /**
   * Elimina documentos por source
   */
  deleteBySource(source: string): Promise<number>;

  /**
   * Estadísticas del índice
   */
  getStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
  }>;
}
