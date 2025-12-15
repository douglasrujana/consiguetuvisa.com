// src/server/lib/features/knowledge/Knowledge.graphql.ts

/**
 * DEFINICIÓN Y RESOLVERS PARA LA FEATURE DE KNOWLEDGE BASE
 * Tipos GraphQL para Sources, Documents, Chunks y búsqueda semántica.
 * 
 * @requirements 8.1 - API GraphQL Unificada
 * @requirements 8.4 - Mutation ingestDocument
 */

import { gql } from 'graphql-tag';
import { ZodError } from 'zod';
import { BusinessRuleError } from '../../core/error/Domain.error';
import type { GraphQLContext } from '../../core/di/ContextFactory';

// ----------------------------------------------------------------------
// 1. TYPE DEFINITIONS DE KNOWLEDGE BASE
// ----------------------------------------------------------------------

export const knowledgeTypeDefs = gql`
  # Enums
  enum SourceType {
    BLOB
    SANITY
    WEB
    SOCIAL
    RSS
    MANUAL
  }

  enum DocumentStatus {
    PENDING
    INDEXED
    FAILED
    OUTDATED
  }

  # Types
  type Source {
    id: ID!
    type: SourceType!
    name: String!
    config: String!
    isActive: Boolean!
    lastSyncAt: String
    createdAt: String!
    updatedAt: String!
    documents: [KBDocument!]
    documentsCount: Int!
  }

  type KBDocument {
    id: ID!
    sourceId: String!
    externalId: String!
    title: String!
    contentHash: String!
    status: DocumentStatus!
    metadata: String
    indexedAt: String
    createdAt: String!
    updatedAt: String!
    chunks: [Chunk!]
    chunksCount: Int!
  }

  type Chunk {
    id: ID!
    documentId: String!
    content: String!
    position: Int!
    metadata: String
    createdAt: String!
  }

  # Search Results
  type SearchResult {
    content: String!
    source: String!
    score: Float!
    documentId: String
    chunkId: String
  }

  type SearchResponse {
    results: [SearchResult!]!
    totalResults: Int!
    query: String!
  }

  # Ingestion
  type IngestionResult {
    success: Boolean!
    documentId: String
    contentHash: String
    chunksCreated: Int!
    skipped: Boolean
    skipReason: String
    error: String
  }

  # Inputs
  input CreateSourceInput {
    type: SourceType!
    name: String!
    config: String!
    isActive: Boolean
  }

  input UpdateSourceInput {
    name: String
    config: String
    isActive: Boolean
  }

  input IngestDocumentInput {
    content: String!
    sourceId: String!
    externalId: String
    title: String
    metadata: String
  }

  input SearchKnowledgeInput {
    query: String!
    topK: Int
    minScore: Float
    sourceType: SourceType
  }

  # Queries y Mutations
  extend type Query {
    "Obtiene todas las fuentes de datos configuradas"
    sources: [Source!]!
    
    "Obtiene una fuente por ID"
    source(id: ID!): Source
    
    "Obtiene fuentes activas"
    activeSources: [Source!]!
    
    "Obtiene documentos por fuente"
    documentsBySource(sourceId: ID!): [KBDocument!]!
    
    "Obtiene un documento por ID"
    document(id: ID!): KBDocument
    
    "Búsqueda semántica en la base de conocimiento"
    searchKnowledge(input: SearchKnowledgeInput!): SearchResponse!
    
    "Estadísticas de la base de conocimiento"
    knowledgeStats: KnowledgeStats!
  }

  type KnowledgeStats {
    totalSources: Int!
    activeSources: Int!
    totalDocuments: Int!
    indexedDocuments: Int!
    pendingDocuments: Int!
    failedDocuments: Int!
    totalChunks: Int!
  }

  extend type Mutation {
    "Crea una nueva fuente de datos"
    createSource(input: CreateSourceInput!): Source!
    
    "Actualiza una fuente existente"
    updateSource(id: ID!, input: UpdateSourceInput!): Source!
    
    "Desactiva una fuente (preserva documentos)"
    deactivateSource(id: ID!): Source!
    
    "Elimina una fuente y sus documentos"
    deleteSource(id: ID!): Boolean!
    
    "Ingesta un documento en la base de conocimiento"
    ingestDocument(input: IngestDocumentInput!): IngestionResult!
    
    "Elimina un documento y sus chunks"
    deleteDocument(id: ID!): Boolean!
  }
`;

// ----------------------------------------------------------------------
// 2. RESOLVERS DE KNOWLEDGE BASE
// ----------------------------------------------------------------------

export const knowledgeResolvers = {
  Query: {
    sources: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const sources = await context.sourceRepository.findAll();
      return sources.map(mapSourceToGraphQL);
    },

    source: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const source = await context.sourceRepository.findById(id);
      return source ? mapSourceToGraphQL(source) : null;
    },

    activeSources: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const sources = await context.sourceRepository.findActive();
      return sources.map(mapSourceToGraphQL);
    },

    documentsBySource: async (
      _: unknown,
      { sourceId }: { sourceId: string },
      context: GraphQLContext
    ) => {
      const documents = await context.documentRepository.findBySourceId(sourceId);
      return documents.map(mapDocumentToGraphQL);
    },

    document: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const document = await context.documentRepository.findById(id);
      return document ? mapDocumentToGraphQL(document) : null;
    },

    searchKnowledge: async (
      _: unknown,
      { input }: { input: SearchKnowledgeInput },
      context: GraphQLContext
    ) => {
      const { query, topK = 5, minScore = 0.7 } = input;

      // Use RAG service for semantic search
      const retrievedContext = await context.ragService.retrieve(query, {
        topK,
        minScore,
      });

      const results = retrievedContext.chunks.map((chunk) => ({
        content: chunk.content,
        source: (chunk.metadata?.source as string) ?? 'unknown',
        score: chunk.score ?? 0,
        documentId: chunk.metadata?.documentId as string | undefined,
        chunkId: chunk.id,
      }));

      return {
        results,
        totalResults: results.length,
        query,
      };
    },

    knowledgeStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const [sources, activeSources] = await Promise.all([
        context.sourceRepository.findAll(),
        context.sourceRepository.findActive(),
      ]);

      // Si ingestionService no está disponible, obtener stats directamente de Prisma
      let ingestionStats = {
        totalDocuments: 0,
        indexedDocuments: 0,
        pendingDocuments: 0,
        failedDocuments: 0,
        totalChunks: 0,
      };

      if (context.ingestionService) {
        ingestionStats = await context.ingestionService.getStats();
      } else {
        // Fallback: obtener stats directamente de la BD
        const [totalDocs, indexedDocs, pendingDocs, failedDocs, totalChunks] = await Promise.all([
          context.prisma.kBDocument.count(),
          context.prisma.kBDocument.count({ where: { status: 'INDEXED' } }),
          context.prisma.kBDocument.count({ where: { status: 'PENDING' } }),
          context.prisma.kBDocument.count({ where: { status: 'FAILED' } }),
          context.prisma.chunk.count(),
        ]);
        ingestionStats = {
          totalDocuments: totalDocs,
          indexedDocuments: indexedDocs,
          pendingDocuments: pendingDocs,
          failedDocuments: failedDocs,
          totalChunks: totalChunks,
        };
      }

      return {
        totalSources: sources.length,
        activeSources: activeSources.length,
        totalDocuments: ingestionStats.totalDocuments,
        indexedDocuments: ingestionStats.indexedDocuments,
        pendingDocuments: ingestionStats.pendingDocuments,
        failedDocuments: ingestionStats.failedDocuments,
        totalChunks: ingestionStats.totalChunks,
      };
    },
  },

  Mutation: {
    createSource: async (
      _: unknown,
      { input }: { input: CreateSourceInput },
      context: GraphQLContext
    ) => {
      try {
        const config = JSON.parse(input.config);
        const source = await context.sourceService.createSource({
          type: input.type,
          name: input.name,
          config,
          isActive: input.isActive ?? true,
        });
        return mapSourceToGraphQL(source);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BusinessRuleError(
            `Error de validación: ${error.issues.map((i) => i.message).join(', ')}`
          );
        }
        throw error;
      }
    },

    updateSource: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateSourceInput },
      context: GraphQLContext
    ) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.config !== undefined) {
        updateData.config = JSON.parse(input.config);
      }
      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      const source = await context.sourceRepository.update(id, updateData);
      return mapSourceToGraphQL(source);
    },

    deactivateSource: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const source = await context.sourceRepository.deactivate(id);
      return mapSourceToGraphQL(source);
    },

    deleteSource: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      await context.sourceRepository.delete(id);
      return true;
    },

    ingestDocument: async (
      _: unknown,
      { input }: { input: IngestDocumentInput },
      context: GraphQLContext
    ) => {
      const result = await context.ingestionService.ingestContent({
        content: input.content,
        sourceId: input.sourceId,
        externalId: input.externalId,
        title: input.title,
        metadata: input.metadata ? JSON.parse(input.metadata) : undefined,
      });

      return {
        success: result.success,
        documentId: result.documentId,
        contentHash: result.contentHash,
        chunksCreated: result.chunksCreated,
        skipped: result.skipped,
        skipReason: result.skipReason,
        error: result.error,
      };
    },

    deleteDocument: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      await context.documentRepository.delete(id);
      return true;
    },
  },

  // Field resolvers
  Source: {
    documents: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      const documents = await context.documentRepository.findBySourceId(parent.id);
      return documents.map(mapDocumentToGraphQL);
    },
    documentsCount: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      return context.prisma.kBDocument.count({ where: { sourceId: parent.id } });
    },
  },

  KBDocument: {
    chunks: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      const chunks = await context.prisma.chunk.findMany({
        where: { documentId: parent.id },
        orderBy: { position: 'asc' },
      });
      return chunks.map(mapChunkToGraphQL);
    },
    chunksCount: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      return context.prisma.chunk.count({ where: { documentId: parent.id } });
    },
  },
};

// ----------------------------------------------------------------------
// 3. HELPER TYPES & MAPPERS
// ----------------------------------------------------------------------

interface SearchKnowledgeInput {
  query: string;
  topK?: number;
  minScore?: number;
  sourceType?: string;
}

interface CreateSourceInput {
  type: string;
  name: string;
  config: string;
  isActive?: boolean;
}

interface UpdateSourceInput {
  name?: string;
  config?: string;
  isActive?: boolean;
}

interface IngestDocumentInput {
  content: string;
  sourceId: string;
  externalId?: string;
  title?: string;
  metadata?: string;
}

function mapSourceToGraphQL(source: {
  id: string;
  type: string;
  name: string;
  config: unknown;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: source.id,
    type: source.type,
    name: source.name,
    config: JSON.stringify(source.config),
    isActive: source.isActive,
    lastSyncAt: source.lastSyncAt?.toISOString() ?? null,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function mapDocumentToGraphQL(doc: {
  id: string;
  sourceId: string;
  externalId: string;
  title: string;
  contentHash: string;
  status: string;
  metadata?: unknown;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc.id,
    sourceId: doc.sourceId,
    externalId: doc.externalId,
    title: doc.title,
    contentHash: doc.contentHash,
    status: doc.status,
    metadata: doc.metadata ? JSON.stringify(doc.metadata) : null,
    indexedAt: doc.indexedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function mapChunkToGraphQL(chunk: {
  id: string;
  documentId: string;
  content: string;
  position: number;
  metadata: string | null;
  createdAt: Date;
}) {
  return {
    id: chunk.id,
    documentId: chunk.documentId,
    content: chunk.content,
    position: chunk.position,
    metadata: chunk.metadata,
    createdAt: chunk.createdAt.toISOString(),
  };
}
