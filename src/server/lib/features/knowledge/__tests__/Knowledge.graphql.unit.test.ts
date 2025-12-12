// src/server/lib/features/knowledge/__tests__/Knowledge.graphql.unit.test.ts

/**
 * UNIT TESTS FOR KNOWLEDGE GRAPHQL RESOLVERS
 * Tests that queries and mutations return expected shapes.
 * 
 * @requirements 8.1 - API GraphQL Unificada
 * @requirements 8.2 - Query searchKnowledge
 * @requirements 8.3 - Query conversation
 * @requirements 8.4 - Mutation ingestDocument
 */

import { describe, test, expect, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../../../db/prisma-singleton';
import { knowledgeResolvers } from '../Knowledge.graphql';
import { SourceRepository } from '../Source.repository';
import { SourceService } from '../Source.service';
import { DocumentRepository } from '../Document.repository';
import type { GraphQLContext } from '../../../core/di/ContextFactory';

// Mock RAG service for testing
const mockRagService = {
  retrieve: async (query: string, options?: { topK?: number; minScore?: number }) => ({
    chunks: [
      {
        id: 'chunk-1',
        content: `Result for: ${query}`,
        source: 'test-source',
        score: 0.95,
        metadata: { documentId: 'doc-1', source: 'test' },
      },
    ],
    query,
  }),
  indexDocuments: async () => {},
};

// Mock ingestion service for testing
const mockIngestionService = {
  ingestContent: async (input: { content: string; sourceId: string }) => ({
    success: true,
    documentId: 'doc-123',
    contentHash: 'hash-123',
    chunksCreated: 3,
    skipped: false,
  }),
  getStats: async () => ({
    totalDocuments: 10,
    indexedDocuments: 8,
    pendingDocuments: 1,
    failedDocuments: 1,
    totalChunks: 50,
  }),
};

// Create test context
function createTestContext(): GraphQLContext {
  const sourceRepository = new SourceRepository(prisma);
  const sourceService = new SourceService(sourceRepository);
  const documentRepository = new DocumentRepository(prisma);

  return {
    request: new Request('http://localhost'),
    authService: {} as any,
    userService: {} as any,
    leadService: {} as any,
    solicitudService: {} as any,
    pageService: {} as any,
    blogService: {} as any,
    aiService: {} as any,
    sourceRepository,
    sourceService,
    documentRepository,
    alertRepository: {} as any,
    ragService: mockRagService as any,
    ingestionService: mockIngestionService as any,
    prisma,
  };
}

describe('Knowledge GraphQL Resolvers - Unit Tests', () => {
  let context: GraphQLContext;

  afterAll(async () => {
    // Cleanup test data
    await prisma.chunk.deleteMany({});
    await prisma.kBDocument.deleteMany({});
    await prisma.source.deleteMany({});
  });

  beforeEach(async () => {
    context = createTestContext();
    
    // Clean up before each test
    await prisma.chunk.deleteMany({});
    await prisma.kBDocument.deleteMany({});
    await prisma.source.deleteMany({});
  });

  describe('Query: sources', () => {
    test('should return empty array when no sources exist', async () => {
      const result = await knowledgeResolvers.Query.sources(null, {}, context);
      expect(result).toEqual([]);
    });

    test('should return all sources with correct shape', async () => {
      // Create test source
      await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'Test Source',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      const result = await knowledgeResolvers.Query.sources(null, {}, context);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type', 'MANUAL');
      expect(result[0]).toHaveProperty('name', 'Test Source');
      expect(result[0]).toHaveProperty('config');
      expect(result[0]).toHaveProperty('isActive', true);
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });
  });

  describe('Query: source', () => {
    test('should return null for non-existent source', async () => {
      const result = await knowledgeResolvers.Query.source(
        null,
        { id: 'non-existent-id' },
        context
      );
      expect(result).toBeNull();
    });

    test('should return source by ID with correct shape', async () => {
      const created = await prisma.source.create({
        data: {
          type: 'BLOB',
          name: 'Blob Source',
          config: JSON.stringify({ type: 'BLOB', bucket: 'test-bucket' }),
          isActive: true,
        },
      });

      const result = await knowledgeResolvers.Query.source(
        null,
        { id: created.id },
        context
      );

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: created.id,
        type: 'BLOB',
        name: 'Blob Source',
        isActive: true,
      });
    });
  });

  describe('Query: activeSources', () => {
    test('should return only active sources', async () => {
      // Create active and inactive sources
      await prisma.source.createMany({
        data: [
          { type: 'MANUAL', name: 'Active', config: '{"type":"MANUAL"}', isActive: true },
          { type: 'MANUAL', name: 'Inactive', config: '{"type":"MANUAL"}', isActive: false },
        ],
      });

      const result = await knowledgeResolvers.Query.activeSources(null, {}, context);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });
  });

  describe('Query: searchKnowledge', () => {
    test('should return search results with correct shape', async () => {
      const result = await knowledgeResolvers.Query.searchKnowledge(
        null,
        { input: { query: 'test query', topK: 5, minScore: 0.7 } },
        context
      );

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('totalResults');
      expect(result).toHaveProperty('query', 'test query');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toHaveProperty('content');
      expect(result.results[0]).toHaveProperty('source');
      expect(result.results[0]).toHaveProperty('score');
    });
  });

  describe('Query: knowledgeStats', () => {
    test('should return statistics with correct shape', async () => {
      const result = await knowledgeResolvers.Query.knowledgeStats(null, {}, context);

      expect(result).toHaveProperty('totalSources');
      expect(result).toHaveProperty('activeSources');
      expect(result).toHaveProperty('totalDocuments');
      expect(result).toHaveProperty('indexedDocuments');
      expect(result).toHaveProperty('pendingDocuments');
      expect(result).toHaveProperty('failedDocuments');
      expect(result).toHaveProperty('totalChunks');
    });
  });

  describe('Mutation: createSource', () => {
    test('should create source and return correct shape', async () => {
      const result = await knowledgeResolvers.Mutation.createSource(
        null,
        {
          input: {
            type: 'MANUAL',
            name: 'New Source',
            config: JSON.stringify({ type: 'MANUAL' }),
            isActive: true,
          },
        },
        context
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type', 'MANUAL');
      expect(result).toHaveProperty('name', 'New Source');
      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('Mutation: updateSource', () => {
    test('should update source and return correct shape', async () => {
      const created = await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'Original Name',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      const result = await knowledgeResolvers.Mutation.updateSource(
        null,
        { id: created.id, input: { name: 'Updated Name' } },
        context
      );

      expect(result).toMatchObject({
        id: created.id,
        name: 'Updated Name',
        isActive: true,
      });
    });
  });

  describe('Mutation: deactivateSource', () => {
    test('should deactivate source and return correct shape', async () => {
      const created = await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'Active Source',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      const result = await knowledgeResolvers.Mutation.deactivateSource(
        null,
        { id: created.id },
        context
      );

      expect(result).toMatchObject({
        id: created.id,
        isActive: false,
      });
    });
  });

  describe('Mutation: deleteSource', () => {
    test('should delete source and return true', async () => {
      const created = await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'To Delete',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      const result = await knowledgeResolvers.Mutation.deleteSource(
        null,
        { id: created.id },
        context
      );

      expect(result).toBe(true);

      // Verify deletion
      const deleted = await prisma.source.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('Mutation: ingestDocument', () => {
    test('should ingest document and return correct shape', async () => {
      // Create a source first
      const source = await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'Ingest Source',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      const result = await knowledgeResolvers.Mutation.ingestDocument(
        null,
        {
          input: {
            content: 'Test document content for ingestion',
            sourceId: source.id,
            title: 'Test Document',
          },
        },
        context
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('documentId');
      expect(result).toHaveProperty('contentHash');
      expect(result).toHaveProperty('chunksCreated');
      expect(result).toHaveProperty('skipped');
    });
  });

  describe('Query: documentsBySource', () => {
    test('should return documents for a source with correct shape', async () => {
      const source = await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'Doc Source',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      await prisma.kBDocument.create({
        data: {
          sourceId: source.id,
          externalId: 'ext-1',
          title: 'Test Doc',
          contentHash: 'hash-123',
          status: 'INDEXED',
        },
      });

      const result = await knowledgeResolvers.Query.documentsBySource(
        null,
        { sourceId: source.id },
        context
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('sourceId', source.id);
      expect(result[0]).toHaveProperty('title', 'Test Doc');
      expect(result[0]).toHaveProperty('status', 'INDEXED');
    });
  });

  describe('Mutation: deleteDocument', () => {
    test('should delete document and return true', async () => {
      const source = await prisma.source.create({
        data: {
          type: 'MANUAL',
          name: 'Delete Doc Source',
          config: JSON.stringify({ type: 'MANUAL' }),
          isActive: true,
        },
      });

      const doc = await prisma.kBDocument.create({
        data: {
          sourceId: source.id,
          externalId: 'to-delete',
          title: 'To Delete',
          contentHash: 'hash-del',
          status: 'INDEXED',
        },
      });

      const result = await knowledgeResolvers.Mutation.deleteDocument(
        null,
        { id: doc.id },
        context
      );

      expect(result).toBe(true);

      // Verify deletion
      const deleted = await prisma.kBDocument.findUnique({ where: { id: doc.id } });
      expect(deleted).toBeNull();
    });
  });
});
