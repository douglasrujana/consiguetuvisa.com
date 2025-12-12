// src/server/lib/core/rag/__tests__/TursoVectorStore.property.test.ts

/**
 * Property-Based Tests for TursoVectorStore
 * 
 * Tests the following correctness properties:
 * - Property 5: Vector Store Persistence
 * - Property 6: Similarity Search Self-Match
 * - Property 7: Cascade Delete Integrity
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { TursoVectorStoreAdapter } from '../adapters/TursoVectorStore.adapter';
import type { VectorDocument } from '../VectorStore.port';
import { prisma } from '../../../../db/prisma-singleton';

// Configure fast-check to run minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Test dimensions (smaller for faster tests)
const TEST_DIMENSIONS = 128;

// Helper to generate a normalized random vector
const vectorArbitrary = (dimensions: number) =>
  fc.array(fc.float({ min: -1, max: 1, noNaN: true }), {
    minLength: dimensions,
    maxLength: dimensions,
  }).map((arr) => {
    // Normalize the vector
    const magnitude = Math.sqrt(arr.reduce((sum, v) => sum + v * v, 0));
    return magnitude === 0 ? arr : arr.map((v) => v / magnitude);
  });

// Helper to generate a valid date within a reasonable range
const validDateArbitrary = fc.date({
  min: new Date('2000-01-01T00:00:00.000Z'),
  max: new Date('2030-12-31T23:59:59.999Z'),
});

// Helper to generate a valid VectorDocument
const vectorDocumentArbitrary = (dimensions: number) =>
  fc.record({
    id: fc.uuid(),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    embedding: vectorArbitrary(dimensions),
    metadata: fc.option(
      fc.record({
        source: fc.string({ minLength: 1 }),
        timestamp: validDateArbitrary.map((d) => d.toISOString()),
      }),
      { nil: undefined }
    ),
  });

describe('TursoVectorStore - Property Tests', () => {
  let vectorStore: TursoVectorStoreAdapter;

  beforeEach(async () => {
    vectorStore = new TursoVectorStoreAdapter({
      prisma,
      model: 'test-model',
      dimensions: TEST_DIMENSIONS,
    });

    // Clean up test data before each test
    await prisma.embedding.deleteMany({});
    await prisma.chunk.deleteMany({});
    await prisma.kBDocument.deleteMany({
      where: { source: { name: 'Temporary Source' } },
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.embedding.deleteMany({});
    await prisma.chunk.deleteMany({});
    await prisma.kBDocument.deleteMany({
      where: { source: { name: 'Temporary Source' } },
    });
  });

  /**
   * **Feature: rag-knowledge-system, Property 5: Vector Store Persistence**
   * For any set of embeddings stored in the vector store, recreating the store
   * instance should load all previously stored embeddings.
   * **Validates: Requirements 3.1**
   */
  describe('Property 5: Vector Store Persistence', () => {
    test('stored documents persist across store instances', async () => {
      await fc.assert(
        fc.asyncProperty(
          vectorDocumentArbitrary(TEST_DIMENSIONS),
          async (doc) => {
            // Store the document
            await vectorStore.upsert(doc);

            // Create a new store instance (simulating restart)
            const newStore = new TursoVectorStoreAdapter({
              prisma,
              model: 'test-model',
              dimensions: TEST_DIMENSIONS,
            });

            // Retrieve the document from the new instance
            const retrieved = await newStore.get(doc.id);

            // Verify the document was persisted
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(doc.id);
            expect(retrieved?.content).toBe(doc.content);
            
            // Verify embedding is approximately equal (floating point tolerance)
            if (retrieved) {
              expect(retrieved.embedding.length).toBe(doc.embedding.length);
              for (let i = 0; i < doc.embedding.length; i++) {
                expect(retrieved.embedding[i]).toBeCloseTo(doc.embedding[i], 5);
              }
            }

            // Cleanup
            await vectorStore.delete(doc.id);
            return true;
          }
        ),
        { numRuns: 20 } // Reduced runs for DB tests
      );
    });

    test('count persists across store instances', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(vectorDocumentArbitrary(TEST_DIMENSIONS), { minLength: 1, maxLength: 5 }),
          async (docs) => {
            // Store all documents
            for (const doc of docs) {
              await vectorStore.upsert(doc);
            }

            // Create a new store instance
            const newStore = new TursoVectorStoreAdapter({
              prisma,
              model: 'test-model',
              dimensions: TEST_DIMENSIONS,
            });

            // Verify count matches
            const count = await newStore.count();
            expect(count).toBe(docs.length);

            // Cleanup
            for (const doc of docs) {
              await vectorStore.delete(doc.id);
            }
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Feature: rag-knowledge-system, Property 6: Similarity Search Self-Match**
   * For any indexed chunk, searching with that chunk's exact content should
   * return that chunk with a similarity score above 0.9.
   * **Validates: Requirements 3.2**
   */
  describe('Property 6: Similarity Search Self-Match', () => {
    test('searching with exact embedding returns self with high score', async () => {
      await fc.assert(
        fc.asyncProperty(
          vectorDocumentArbitrary(TEST_DIMENSIONS),
          async (doc) => {
            // Store the document
            await vectorStore.upsert(doc);

            // Search with the exact same embedding
            const results = await vectorStore.search(doc.embedding, {
              topK: 10,
              minScore: 0.0, // Accept all scores to verify
            });

            // The document should be in results
            const selfMatch = results.find((r) => r.id === doc.id);
            expect(selfMatch).toBeDefined();

            // Self-match should have score very close to 1.0 (cosine similarity of identical vectors)
            if (selfMatch) {
              expect(selfMatch.score).toBeGreaterThan(0.9);
            }

            // Cleanup
            await vectorStore.delete(doc.id);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('self-match should be the top result when searching with exact embedding', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(vectorDocumentArbitrary(TEST_DIMENSIONS), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0 }),
          async (docs, targetIndex) => {
            // Ensure unique IDs
            const uniqueDocs = docs.map((doc, i) => ({
              ...doc,
              id: `${doc.id}-${i}`,
            }));

            // Store all documents
            for (const doc of uniqueDocs) {
              await vectorStore.upsert(doc);
            }

            // Pick a target document
            const target = uniqueDocs[targetIndex % uniqueDocs.length];

            // Search with the target's embedding
            const results = await vectorStore.search(target.embedding, {
              topK: uniqueDocs.length,
              minScore: 0.0,
            });

            // The target should be the top result (or tied for top)
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].id).toBe(target.id);
            expect(results[0].score).toBeGreaterThan(0.9);

            // Cleanup
            for (const doc of uniqueDocs) {
              await vectorStore.delete(doc.id);
            }
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Feature: rag-knowledge-system, Property 7: Cascade Delete Integrity**
   * For any document, deleting it should also delete all associated chunks
   * and embeddings (no orphans).
   * **Validates: Requirements 3.4**
   */
  describe('Property 7: Cascade Delete Integrity', () => {
    test('deleting a document removes its embedding', async () => {
      await fc.assert(
        fc.asyncProperty(
          vectorDocumentArbitrary(TEST_DIMENSIONS),
          async (doc) => {
            // Store the document
            await vectorStore.upsert(doc);

            // Verify it exists
            const beforeDelete = await vectorStore.get(doc.id);
            expect(beforeDelete).not.toBeNull();

            // Delete the document
            await vectorStore.delete(doc.id);

            // Verify it's gone
            const afterDelete = await vectorStore.get(doc.id);
            expect(afterDelete).toBeNull();

            // Verify no orphan embedding exists
            const orphanEmbedding = await prisma.embedding.findFirst({
              where: { chunkId: doc.id },
            });
            expect(orphanEmbedding).toBeNull();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('batch delete removes all specified documents and their embeddings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(vectorDocumentArbitrary(TEST_DIMENSIONS), { minLength: 2, maxLength: 5 }),
          async (docs) => {
            // Ensure unique IDs
            const uniqueDocs = docs.map((doc, i) => ({
              ...doc,
              id: `${doc.id}-${i}`,
            }));

            // Store all documents
            for (const doc of uniqueDocs) {
              await vectorStore.upsert(doc);
            }

            // Verify count before delete
            const countBefore = await vectorStore.count();
            expect(countBefore).toBe(uniqueDocs.length);

            // Delete all documents
            const ids = uniqueDocs.map((d) => d.id);
            await vectorStore.deleteBatch(ids);

            // Verify count after delete
            const countAfter = await vectorStore.count();
            expect(countAfter).toBe(0);

            // Verify no orphan embeddings
            for (const doc of uniqueDocs) {
              const orphan = await prisma.embedding.findFirst({
                where: { chunkId: doc.id },
              });
              expect(orphan).toBeNull();
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    test('deleting non-existent document does not throw', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (id) => {
          // Should not throw when deleting non-existent document
          await expect(vectorStore.delete(id)).resolves.not.toThrow();
          return true;
        }),
        { numRuns: 20 }
      );
    });
  });
});
