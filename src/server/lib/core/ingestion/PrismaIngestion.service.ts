// src/server/lib/core/ingestion/PrismaIngestion.service.ts

/**
 * SERVICIO DE INGESTA CON PRISMA - Orquesta el pipeline de ingesta con persistencia
 * Load → Hash Check → Chunk → Embed → Store (DB + VectorStore)
 * 
 * **Feature: rag-knowledge-system, Property 3: Ingestion Idempotence**
 * **Feature: rag-knowledge-system, Property 4: Ingestion Round-Trip**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7**
 */

import type { PrismaClient } from '@prisma/client';
import type {
  IIngestionService,
  IDocumentLoader,
  IDocumentChunker,
  RawDocument,
  IngestionResult,
  ChunkingOptions,
} from './Ingestion.port';
import type { IRAGEngine, DocumentChunk } from '../rag/RAG.port';
import type { IDocumentRepository } from '../../features/knowledge/Document.port';
import { DocumentStatus, calculateContentHash } from '../../features/knowledge/Document.entity';
import { MarkdownLoader } from './loaders/MarkdownLoader';
import { TextLoader } from './loaders/TextLoader';
import { TextChunker } from './chunkers/TextChunker';
import { nanoid } from 'nanoid';

/**
 * Extended ingestion result with document info
 */
export interface PrismaIngestionResult extends IngestionResult {
  documentId?: string;
  contentHash?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Input for ingesting content directly (not from file)
 */
export interface IngestContentInput {
  content: string;
  sourceId: string;
  externalId?: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface PrismaIngestionServiceConfig {
  prisma: PrismaClient;
  ragEngine: IRAGEngine;
  documentRepository: IDocumentRepository;
  chunkingOptions?: ChunkingOptions;
}

export class PrismaIngestionService implements IIngestionService {
  private prisma: PrismaClient;
  private ragEngine: IRAGEngine;
  private documentRepository: IDocumentRepository;
  private loaders: IDocumentLoader[];
  private chunker: IDocumentChunker;
  private chunkingOptions: ChunkingOptions;

  constructor(config: PrismaIngestionServiceConfig) {
    this.prisma = config.prisma;
    this.ragEngine = config.ragEngine;
    this.documentRepository = config.documentRepository;
    this.chunkingOptions = config.chunkingOptions ?? {};

    // Register default loaders
    this.loaders = [new MarkdownLoader(), new TextLoader()];

    // Default chunker
    this.chunker = new TextChunker();
  }


  /**
   * Ingest content directly (not from file)
   * This is the main method for manual ingestion via API
   * 
   * Property 3: Ingestion Idempotence - same content won't create duplicates
   * Property 4: Ingestion Round-Trip - content can be retrieved after ingestion
   */
  async ingestContent(input: IngestContentInput): Promise<PrismaIngestionResult> {
    const { content, sourceId, externalId, title, metadata } = input;
    const generatedExternalId = externalId ?? nanoid();
    const generatedTitle = title ?? `Document ${generatedExternalId}`;

    try {
      console.log(`[PrismaIngestion] Processing content for source: ${sourceId}`);

      // 1. Calculate content hash for duplicate detection
      const contentHash = calculateContentHash(content);
      console.log(`[PrismaIngestion] Content hash: ${contentHash.substring(0, 16)}...`);

      // 2. Check for existing document with same hash (Property 3: Idempotence)
      const existingByHash = await this.documentRepository.findByContentHash(contentHash);
      if (existingByHash) {
        console.log(`[PrismaIngestion] Duplicate detected by hash, skipping: ${existingByHash.id}`);
        return {
          source: sourceId,
          chunksCreated: 0,
          success: true,
          documentId: existingByHash.id,
          contentHash,
          skipped: true,
          skipReason: 'duplicate_content_hash',
        };
      }

      // 3. Check for existing document with same externalId
      const existingByExternalId = await this.documentRepository.findByExternalId(
        sourceId,
        generatedExternalId
      );

      let documentId: string;

      if (existingByExternalId) {
        // Document exists - check if content changed
        if (existingByExternalId.contentHash === contentHash) {
          console.log(`[PrismaIngestion] Content unchanged, skipping: ${existingByExternalId.id}`);
          return {
            source: sourceId,
            chunksCreated: 0,
            success: true,
            documentId: existingByExternalId.id,
            contentHash,
            skipped: true,
            skipReason: 'content_unchanged',
          };
        }

        // Content changed - delete old chunks and re-index
        console.log(`[PrismaIngestion] Content changed, re-indexing: ${existingByExternalId.id}`);
        await this.deleteDocumentChunks(existingByExternalId.id);
        await this.documentRepository.updateContentHash(existingByExternalId.id, contentHash);
        documentId = existingByExternalId.id;
      } else {
        // Create new document
        const newDoc = await this.documentRepository.create({
          sourceId,
          externalId: generatedExternalId,
          title: generatedTitle,
          content, // Used for hash calculation
          contentHash,
          metadata: metadata as any,
        });
        documentId = newDoc.id;
        console.log(`[PrismaIngestion] Created new document: ${documentId}`);
      }

      // 4. Create raw document for chunking
      const rawDoc: RawDocument = {
        id: documentId,
        content,
        source: sourceId,
        type: 'text',
        metadata: {
          title: generatedTitle,
          documentId,
          ...metadata,
        },
      };

      // 5. Chunk the document
      const chunks = this.chunker.chunk(rawDoc, this.chunkingOptions);
      console.log(`[PrismaIngestion] Created ${chunks.length} chunks`);

      // 6. Save chunks to database and index in vector store
      const docChunks: DocumentChunk[] = [];

      for (const chunk of chunks) {
        // Save chunk to database
        const savedChunk = await this.prisma.chunk.create({
          data: {
            documentId,
            content: chunk.content,
            position: chunk.chunkIndex,
            metadata: JSON.stringify({
              ...chunk.metadata,
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks,
            }),
          },
        });

        docChunks.push({
          id: savedChunk.id,
          content: savedChunk.content,
          source: sourceId,
          metadata: {
            documentId,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            ...chunk.metadata,
          },
        });
      }

      // 7. Index chunks in RAG (embed + store in vector store)
      await this.ragEngine.indexDocuments(docChunks);
      console.log(`[PrismaIngestion] Indexed ${chunks.length} chunks in vector store`);

      // 8. Mark document as indexed
      await this.documentRepository.markIndexed(documentId);

      return {
        source: sourceId,
        chunksCreated: chunks.length,
        success: true,
        documentId,
        contentHash,
        skipped: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PrismaIngestion] Error:`, message);

      return {
        source: sourceId,
        chunksCreated: 0,
        success: false,
        error: message,
        skipped: false,
      };
    }
  }


  /**
   * Ingest from file source (implements IIngestionService)
   */
  async ingest(source: string, type?: RawDocument['type']): Promise<IngestionResult> {
    try {
      console.log(`[PrismaIngestion] Processing file: ${source}`);

      // 1. Load document from file
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
      console.log(`[PrismaIngestion] Loaded: ${rawDoc.metadata?.title || source}`);

      // 2. Use ingestContent for the actual ingestion
      // We need a sourceId - use or create a MANUAL source
      const manualSource = await this.getOrCreateManualSource();

      return this.ingestContent({
        content: rawDoc.content,
        sourceId: manualSource.id,
        externalId: source, // Use file path as external ID
        title: (rawDoc.metadata?.title as string) ?? source,
        metadata: rawDoc.metadata,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PrismaIngestion] Error processing ${source}:`, message);

      return {
        source,
        chunksCreated: 0,
        success: false,
        error: message,
      };
    }
  }

  /**
   * Ingest multiple sources
   */
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

  /**
   * Re-index a document by deleting and re-ingesting
   */
  async reindex(source: string): Promise<IngestionResult> {
    // Find document by external ID
    const manualSource = await this.getOrCreateManualSource();
    const existingDoc = await this.documentRepository.findByExternalId(manualSource.id, source);

    if (existingDoc) {
      // Delete existing document (cascade deletes chunks and embeddings)
      await this.documentRepository.delete(existingDoc.id);
      console.log(`[PrismaIngestion] Deleted existing document for reindex: ${existingDoc.id}`);
    }

    // Re-ingest
    return this.ingest(source);
  }

  /**
   * Register additional loader
   */
  registerLoader(loader: IDocumentLoader): void {
    this.loaders.unshift(loader); // Priority to custom loaders
  }

  /**
   * Change chunker
   */
  setChunker(chunker: IDocumentChunker): void {
    this.chunker = chunker;
  }

  /**
   * Delete all chunks for a document
   */
  private async deleteDocumentChunks(documentId: string): Promise<void> {
    // Cascade delete handles embeddings
    await this.prisma.chunk.deleteMany({
      where: { documentId },
    });
    console.log(`[PrismaIngestion] Deleted chunks for document: ${documentId}`);
  }

  /**
   * Find appropriate loader for source
   */
  private findLoader(source: string, type?: RawDocument['type']): IDocumentLoader | null {
    if (type) {
      return this.loaders.find((l) => l.supportedTypes.includes(type)) ?? null;
    }
    return this.loaders.find((l) => l.canLoad(source)) ?? null;
  }

  /**
   * Get or create a MANUAL source for file-based ingestion
   */
  private async getOrCreateManualSource(): Promise<{ id: string }> {
    const existingSource = await this.prisma.source.findFirst({
      where: { type: 'MANUAL', name: 'Manual Ingestion' },
    });

    if (existingSource) {
      return existingSource;
    }

    return this.prisma.source.create({
      data: {
        type: 'MANUAL',
        name: 'Manual Ingestion',
        config: JSON.stringify({ type: 'MANUAL' }),
        isActive: true,
      },
    });
  }

  /**
   * Get ingestion statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    indexedDocuments: number;
    pendingDocuments: number;
    failedDocuments: number;
    totalChunks: number;
  }> {
    const [total, indexed, pending, failed, chunks] = await Promise.all([
      this.prisma.kBDocument.count(),
      this.prisma.kBDocument.count({ where: { status: 'INDEXED' } }),
      this.prisma.kBDocument.count({ where: { status: 'PENDING' } }),
      this.prisma.kBDocument.count({ where: { status: 'FAILED' } }),
      this.prisma.chunk.count(),
    ]);

    return {
      totalDocuments: total,
      indexedDocuments: indexed,
      pendingDocuments: pending,
      failedDocuments: failed,
      totalChunks: chunks,
    };
  }
}
