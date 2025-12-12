// src/server/lib/core/ingestion/index.ts

/**
 * CORE INGESTION - Exportaciones públicas
 */

// Ports (Interfaces)
export type {
  IIngestionService,
  IDocumentLoader,
  IDocumentChunker,
  RawDocument,
  ProcessedChunk,
  ChunkingOptions,
  IngestionResult,
} from './Ingestion.port';

// Services
export { IngestionService, type IngestionServiceConfig } from './Ingestion.service';
export {
  PrismaIngestionService,
  type PrismaIngestionServiceConfig,
  type PrismaIngestionResult,
  type IngestContentInput,
} from './PrismaIngestion.service';

// Loaders
export { MarkdownLoader } from './loaders/MarkdownLoader';
export { TextLoader } from './loaders/TextLoader';

// Chunkers
export { TextChunker } from './chunkers/TextChunker';
