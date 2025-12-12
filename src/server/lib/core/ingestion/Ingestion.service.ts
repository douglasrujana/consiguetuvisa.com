// src/server/lib/core/ingestion/Ingestion.service.ts

/**
 * SERVICIO DE INGESTA - Orquesta el pipeline de ingesta de documentos
 * Load → Chunk → Embed → Store
 */

import type {
  IIngestionService,
  IDocumentLoader,
  IDocumentChunker,
  RawDocument,
  IngestionResult,
  ChunkingOptions,
} from './Ingestion.port';
import type { IRAGEngine, DocumentChunk } from '../rag/RAG.port';
import { MarkdownLoader } from './loaders/MarkdownLoader';
import { TextLoader } from './loaders/TextLoader';
import { TextChunker } from './chunkers/TextChunker';

export interface IngestionServiceConfig {
  ragEngine: IRAGEngine;
  chunkingOptions?: ChunkingOptions;
}

export class IngestionService implements IIngestionService {
  private ragEngine: IRAGEngine;
  private loaders: IDocumentLoader[];
  private chunker: IDocumentChunker;
  private chunkingOptions: ChunkingOptions;

  constructor(config: IngestionServiceConfig) {
    this.ragEngine = config.ragEngine;
    this.chunkingOptions = config.chunkingOptions ?? {};

    // Registrar loaders por defecto
    this.loaders = [new MarkdownLoader(), new TextLoader()];

    // Chunker por defecto
    this.chunker = new TextChunker();
  }

  async ingest(source: string, type?: RawDocument['type']): Promise<IngestionResult> {
    try {
      console.log(`[Ingestion] Procesando: ${source}`);

      // 1. Cargar documento
      const loader = this.findLoader(source, type);
      if (!loader) {
        return {
          source,
          chunksCreated: 0,
          success: false,
          error: `No loader found for source: ${source}`,
        };
      }

      const rawDoc = await loader.load(source);
      console.log(`[Ingestion] Documento cargado: ${rawDoc.metadata?.title || source}`);

      // 2. Dividir en chunks
      const chunks = this.chunker.chunk(rawDoc, this.chunkingOptions);
      console.log(`[Ingestion] Chunks creados: ${chunks.length}`);

      // 3. Convertir a DocumentChunk para RAG
      const docChunks: DocumentChunk[] = chunks.map((c) => ({
        id: c.id,
        content: c.content,
        source: c.source,
        metadata: {
          ...c.metadata,
          chunkIndex: c.chunkIndex,
          totalChunks: c.totalChunks,
        },
      }));

      // 4. Indexar en RAG (embed + store)
      await this.ragEngine.indexDocuments(docChunks);
      console.log(`[Ingestion] Indexados ${chunks.length} chunks de ${source}`);

      return {
        source,
        chunksCreated: chunks.length,
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Ingestion] Error procesando ${source}:`, message);

      return {
        source,
        chunksCreated: 0,
        success: false,
        error: message,
      };
    }
  }

  async ingestBatch(
    sources: Array<{ source: string; type?: RawDocument['type'] }>
  ): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];

    for (const { source, type } of sources) {
      const result = await this.ingest(source, type);
      results.push(result);
    }

    return results;
  }

  async reindex(source: string): Promise<IngestionResult> {
    // Eliminar chunks existentes de esta fuente
    await this.ragEngine.deleteBySource(source);

    // Re-ingestar
    return this.ingest(source);
  }

  /**
   * Registra un loader adicional
   */
  registerLoader(loader: IDocumentLoader): void {
    this.loaders.unshift(loader); // Prioridad a loaders custom
  }

  /**
   * Cambia el chunker
   */
  setChunker(chunker: IDocumentChunker): void {
    this.chunker = chunker;
  }

  private findLoader(source: string, type?: RawDocument['type']): IDocumentLoader | null {
    // Si se especifica tipo, buscar loader que lo soporte
    if (type) {
      return this.loaders.find((l) => l.supportedTypes.includes(type)) ?? null;
    }

    // Buscar por extensión/patrón
    return this.loaders.find((l) => l.canLoad(source)) ?? null;
  }
}
