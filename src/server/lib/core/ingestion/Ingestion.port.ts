// src/server/lib/core/ingestion/Ingestion.port.ts

/**
 * PUERTO INGESTION - Contrato para el pipeline de ingesta de documentos
 * Define interfaces para cargar, procesar y chunkar documentos.
 */

/**
 * Documento crudo antes de procesar
 */
export interface RawDocument {
  id?: string;
  content: string;
  source: string; // URL, filepath, etc.
  type: 'markdown' | 'html' | 'text' | 'pdf';
  metadata?: Record<string, unknown>;
}

/**
 * Chunk de documento procesado
 */
export interface ProcessedChunk {
  id: string;
  content: string;
  source: string;
  chunkIndex: number;
  totalChunks: number;
  metadata?: {
    title?: string;
    section?: string;
    [key: string]: unknown;
  };
}

/**
 * Opciones de chunking
 */
export interface ChunkingOptions {
  chunkSize?: number; // Caracteres por chunk (default: 1000)
  chunkOverlap?: number; // Solapamiento entre chunks (default: 200)
  separator?: string; // Separador preferido (default: '\n\n')
}

/**
 * Resultado de ingesta
 */
export interface IngestionResult {
  source: string;
  chunksCreated: number;
  success: boolean;
  error?: string;
}

/**
 * Contrato para loaders de documentos
 */
export interface IDocumentLoader {
  /**
   * Tipos de documento que puede cargar
   */
  readonly supportedTypes: string[];

  /**
   * Carga un documento desde una fuente
   */
  load(source: string): Promise<RawDocument>;

  /**
   * Verifica si puede cargar esta fuente
   */
  canLoad(source: string): boolean;
}

/**
 * Contrato para chunkers de documentos
 */
export interface IDocumentChunker {
  /**
   * Divide un documento en chunks
   */
  chunk(doc: RawDocument, options?: ChunkingOptions): ProcessedChunk[];
}

/**
 * Contrato para el servicio de ingesta
 */
export interface IIngestionService {
  /**
   * Ingesta un documento (load → chunk → index)
   */
  ingest(source: string, type?: RawDocument['type']): Promise<IngestionResult>;

  /**
   * Ingesta múltiples documentos
   */
  ingestBatch(sources: Array<{ source: string; type?: RawDocument['type'] }>): Promise<IngestionResult[]>;

  /**
   * Re-indexa todos los documentos de una fuente
   */
  reindex(source: string): Promise<IngestionResult>;
}
