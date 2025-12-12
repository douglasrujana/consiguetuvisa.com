// src/server/lib/core/rag/index.ts

/**
 * CORE RAG - Exportaciones públicas
 */

// Ports (Interfaces)
export type {
  IRAGEngine,
  DocumentChunk,
  RAGResponse,
  RAGQueryOptions,
  RetrievedContext,
} from './RAG.port';

export type {
  IVectorStore,
  VectorDocument,
  SearchResult,
  SearchOptions,
  VectorStoreConfig,
} from './VectorStore.port';

// Service
export { RAGService, type RAGServiceConfig } from './RAG.service';

// Adapters
export { MemoryVectorStoreAdapter } from './adapters/MemoryVectorStore.adapter';
export { TursoVectorStoreAdapter, type TursoVectorStoreConfig } from './adapters/TursoVectorStore.adapter';
