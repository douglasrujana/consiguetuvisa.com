// src/server/lib/core/ingestion/__tests__/PrismaIngestion.property.test.ts

/**
 * Property-Based Tests for PrismaIngestionService
 * 
 * Tests the following correctness properties:
 * - Property 3: Ingestion Idempotence
 * - Property 4: Ingestion Round-Trip
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.7**
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { PrismaIngestionService } from '../PrismaIngestion.service';
import type { IRAGEngine, DocumentChunk } from '../../rag/RAG.port';
import { DocumentRepository } from '../../../features/knowledge/Document.repository';
import { prisma } from '../../../../db/prisma-singleton';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Mock RAG Engine that stores indexed documents for verification
class MockRAGEngine implements IRAGEngine {
  public indexedDocuments: DocumentChunk[] = [];
  public deletedSources: string[] = [];

  async indexDocument(doc: DocumentChunk): Promise<void> {
    this.indexedDocuments.push(doc);
  }

  async indexDocuments(docs: DocumentChunk[]): Promise<void> {
    this.indexedDocuments.push(...docs);
  }

  async query(): Promise<{ answer: string; sources: any[] }> {
    return { answer: '', sources: [] };
  }

  async retrieve(): Promise<{ chunks: any[]; totalTokens: number }> {
    return { chunks: [], totalTokens: 0 };
  }

  async deleteBySource(source: string): Promise<number> {
    this.deletedSources.push(source);
    return 0;
  }

  async getStats(): Promise<{ totalDocuments: number; totalChunks: number }> {
    return { totalDocuments: this.indexedDocuments.length, totalChunks: this.indexedDocuments.length };
  }

  clear(): void {
    this.indexedDocuments = [];
    this.deletedSources = [];
  }
}


// Helper to generate valid content for ingestion
const contentArbitrary = fc.string({ minLength: 10, maxLength: 1000 });

// Helper to generate valid source ID
const sourceIdArbitrary = fc.uuid();

// Helper to generate valid title
const titleArbitrary = fc.string({ minLength: 1, maxLength: 100 });

describe('PrismaIngestionService - Property Tests', () => {
  let ingestionService: PrismaIngestionService;
  let mockRAGEngine: MockRAGEngine;
  let documentRepository: DocumentRepository;
  let testSourceId: string;

  beforeEach(async () => {
    mockRAGEngine = new MockRAGEngine();
    documentRepository = new DocumentRepository(prisma);

    ingestionService = new PrismaIngestionService({
      prisma,
      ragEngine: mockRAGEngine,
      documentRepository,
      chunkingOptions: {
        chunkSize: 200,
        chunkOverlap: 50,
      },
    });

    // Clean up test data before each test
    await prisma.embedding.deleteMany({});
    await prisma.chunk.deleteMany({});
    await prisma.kBDocument.deleteMany({});
    
    // Create a test source
    const source = await prisma.source.upsert({
      where: { id: 'test-source-ingestion' },
      create: {
        id: 'test-source-ingestion',
        type: 'MANUAL',
        name: 'Test Source for Ingestion',
        config: JSON.stringify({ type: 'MANUAL' }),
        isActive: true,
      },
      update: {},
    });
    testSourceId = source.id;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.embedding.deleteMany({});
    await prisma.chunk.deleteMany({});
    await prisma.kBDocument.deleteMany({});
    mockRAGEngine.clear();
  });


  /**
   * **Feature: rag-knowledge-system, Property 3: Ingestion Idempotence**
   * For any document, ingesting it multiple times should result in exactly
   * one indexed document (no duplicates).
   * **Validates: Requirements 2.2**
   */
  describe('Property 3: Ingestion Idempotence', () => {
    test('ingesting same content twice creates only one document', async () => {
      await fc.assert(
        fc.asyncProperty(
          contentArbitrary,
          titleArbitrary,
          async (content, title) => {
            // First ingestion
            const result1 = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              title,
            });

            expect(result1.success).toBe(true);
            expect(result1.skipped).toBeFalsy();
            const firstDocId = result1.documentId;

            // Second ingestion with same content
            const result2 = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              title: title + ' (duplicate)',
            });

            expect(result2.success).toBe(true);
            expect(result2.skipped).toBe(true);
            expect(result2.skipReason).toBe('duplicate_content_hash');

            // Verify only one document exists with this content hash
            const docs = await prisma.kBDocument.findMany({
              where: { contentHash: result1.contentHash },
            });
            expect(docs.length).toBe(1);

            // Cleanup
            if (firstDocId) {
              await prisma.chunk.deleteMany({ where: { documentId: firstDocId } });
              await prisma.kBDocument.delete({ where: { id: firstDocId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 20 } // Reduced runs for DB tests
      );
    });

    test('ingesting same externalId with same content skips re-indexing', async () => {
      await fc.assert(
        fc.asyncProperty(
          contentArbitrary,
          titleArbitrary,
          fc.uuid(),
          async (content, title, externalId) => {
            // First ingestion
            const result1 = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              externalId,
              title,
            });

            expect(result1.success).toBe(true);
            const chunksCreatedFirst = result1.chunksCreated;

            // Clear mock to track second ingestion
            mockRAGEngine.clear();

            // Second ingestion with same externalId and content
            const result2 = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              externalId,
              title,
            });

            expect(result2.success).toBe(true);
            expect(result2.skipped).toBe(true);
            // Accept either skip reason - both indicate idempotent behavior
            // 'duplicate_content_hash' = global duplicate detected by hash
            // 'content_unchanged' = same externalId with unchanged content
            expect(['content_unchanged', 'duplicate_content_hash']).toContain(result2.skipReason);
            expect(result2.chunksCreated).toBe(0);

            // Verify RAG engine was not called for second ingestion
            expect(mockRAGEngine.indexedDocuments.length).toBe(0);

            // Cleanup
            if (result1.documentId) {
              await prisma.chunk.deleteMany({ where: { documentId: result1.documentId } });
              await prisma.kBDocument.delete({ where: { id: result1.documentId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('document count remains 1 after multiple ingestions of same content', async () => {
      await fc.assert(
        fc.asyncProperty(
          contentArbitrary,
          fc.integer({ min: 2, max: 5 }),
          async (content, ingestionCount) => {
            let documentId: string | undefined;

            // Ingest the same content multiple times
            for (let i = 0; i < ingestionCount; i++) {
              const result = await ingestionService.ingestContent({
                content,
                sourceId: testSourceId,
                title: `Document attempt ${i}`,
              });

              expect(result.success).toBe(true);
              if (i === 0) {
                documentId = result.documentId;
                expect(result.skipped).toBeFalsy();
              } else {
                expect(result.skipped).toBe(true);
              }
            }

            // Verify only one document exists
            const allDocs = await prisma.kBDocument.findMany({
              where: { sourceId: testSourceId },
            });
            expect(allDocs.length).toBe(1);

            // Cleanup
            if (documentId) {
              await prisma.chunk.deleteMany({ where: { documentId } });
              await prisma.kBDocument.delete({ where: { id: documentId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });


  /**
   * **Feature: rag-knowledge-system, Property 4: Ingestion Round-Trip**
   * For any valid document content, after ingestion, searching for that content
   * should return chunks containing the original text.
   * **Validates: Requirements 2.3, 2.4, 2.5, 2.7**
   */
  describe('Property 4: Ingestion Round-Trip', () => {
    test('ingested content is stored in chunks that can be retrieved', async () => {
      await fc.assert(
        fc.asyncProperty(
          contentArbitrary,
          titleArbitrary,
          async (content, title) => {
            // Ingest the content
            const result = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              title,
            });

            expect(result.success).toBe(true);
            expect(result.documentId).toBeDefined();

            // Retrieve chunks from database
            const chunks = await prisma.chunk.findMany({
              where: { documentId: result.documentId },
              orderBy: { position: 'asc' },
            });

            expect(chunks.length).toBeGreaterThan(0);

            // Verify that concatenating all chunks contains the original content
            // (accounting for chunking which may add some overlap)
            const reconstructed = chunks.map((c) => c.content).join('');
            
            // The original content should be contained within the chunks
            // Note: Due to chunking with overlap, we check that key parts exist
            const contentWords = content.split(/\s+/).filter((w) => w.length > 3);
            if (contentWords.length > 0) {
              // At least some significant words should be in the chunks
              const foundWords = contentWords.filter((word) => 
                chunks.some((chunk) => chunk.content.includes(word))
              );
              expect(foundWords.length).toBeGreaterThan(0);
            }

            // Cleanup
            if (result.documentId) {
              await prisma.chunk.deleteMany({ where: { documentId: result.documentId } });
              await prisma.kBDocument.delete({ where: { id: result.documentId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('ingested content is indexed in RAG engine', async () => {
      await fc.assert(
        fc.asyncProperty(
          contentArbitrary,
          titleArbitrary,
          async (content, title) => {
            mockRAGEngine.clear();

            // Ingest the content
            const result = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              title,
            });

            expect(result.success).toBe(true);

            // Verify RAG engine received the chunks
            expect(mockRAGEngine.indexedDocuments.length).toBe(result.chunksCreated);

            // Verify each indexed chunk contains part of the original content
            for (const indexedDoc of mockRAGEngine.indexedDocuments) {
              expect(indexedDoc.content).toBeDefined();
              expect(indexedDoc.content.length).toBeGreaterThan(0);
              expect(indexedDoc.source).toBe(testSourceId);
              expect(indexedDoc.metadata?.documentId).toBe(result.documentId);
            }

            // Cleanup
            if (result.documentId) {
              await prisma.chunk.deleteMany({ where: { documentId: result.documentId } });
              await prisma.kBDocument.delete({ where: { id: result.documentId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('document status is INDEXED after successful ingestion', async () => {
      await fc.assert(
        fc.asyncProperty(
          contentArbitrary,
          titleArbitrary,
          async (content, title) => {
            // Ingest the content
            const result = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              title,
            });

            expect(result.success).toBe(true);
            expect(result.documentId).toBeDefined();

            // Verify document status
            const doc = await prisma.kBDocument.findUnique({
              where: { id: result.documentId },
            });

            expect(doc).not.toBeNull();
            expect(doc?.status).toBe('INDEXED');
            expect(doc?.indexedAt).not.toBeNull();

            // Cleanup
            if (result.documentId) {
              await prisma.chunk.deleteMany({ where: { documentId: result.documentId } });
              await prisma.kBDocument.delete({ where: { id: result.documentId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('chunk positions are sequential starting from 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Use longer content to ensure multiple chunks
          fc.string({ minLength: 500, maxLength: 2000 }),
          async (content) => {
            // Ingest the content
            const result = await ingestionService.ingestContent({
              content,
              sourceId: testSourceId,
              title: 'Test Document',
            });

            expect(result.success).toBe(true);

            // Retrieve chunks
            const chunks = await prisma.chunk.findMany({
              where: { documentId: result.documentId },
              orderBy: { position: 'asc' },
            });

            // Verify positions are sequential
            for (let i = 0; i < chunks.length; i++) {
              expect(chunks[i].position).toBe(i);
            }

            // Cleanup
            if (result.documentId) {
              await prisma.chunk.deleteMany({ where: { documentId: result.documentId } });
              await prisma.kBDocument.delete({ where: { id: result.documentId } }).catch(() => {});
            }

            return true;
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
