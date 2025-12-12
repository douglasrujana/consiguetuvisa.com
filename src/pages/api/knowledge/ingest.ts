// src/pages/api/knowledge/ingest.ts
// API endpoint para ingesta manual de documentos al knowledge base
// POST /api/knowledge/ingest

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '@server/db/prisma-singleton';
import { PrismaIngestionService } from '@core/ingestion';
import { DocumentRepository } from '@features/knowledge';
import { GeminiLLMAdapter, GeminiEmbeddingAdapter } from '@core/ai';
import { RAGService, MemoryVectorStoreAdapter } from '@core/rag';

// Validation schema for ingest request
const IngestRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  sourceId: z.string().min(1, 'Source ID is required'),
  externalId: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Singleton for RAG engine (in production, use DI container)
let ragEngine: RAGService | null = null;
let ingestionService: PrismaIngestionService | null = null;

async function getIngestionService(): Promise<PrismaIngestionService> {
  if (ingestionService) {
    return ingestionService;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Create RAG components
  const vectorStore = new MemoryVectorStoreAdapter();
  const llm = new GeminiLLMAdapter(apiKey, 'gemini-2.5-flash-lite');
  const embedding = new GeminiEmbeddingAdapter(apiKey);

  ragEngine = new RAGService({ vectorStore, llm, embedding });
  const documentRepository = new DocumentRepository(prisma);

  ingestionService = new PrismaIngestionService({
    prisma,
    ragEngine,
    documentRepository,
    chunkingOptions: {
      chunkSize: 500,
      chunkOverlap: 100,
    },
  });

  return ingestionService;
}


/**
 * POST /api/knowledge/ingest
 * 
 * Ingest content into the knowledge base.
 * 
 * Request body:
 * - content: string (required) - The content to ingest
 * - sourceId: string (required) - The source ID to associate with
 * - externalId: string (optional) - External identifier for the document
 * - title: string (optional) - Document title
 * - metadata: object (optional) - Additional metadata
 * 
 * Response:
 * - success: boolean
 * - documentId: string (if successful)
 * - chunksCreated: number
 * - skipped: boolean (true if duplicate)
 * - skipReason: string (if skipped)
 * - error: string (if failed)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = IngestRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { content, sourceId, externalId, title, metadata } = validationResult.data;

    // Verify source exists
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Source not found: ${sourceId}`,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get ingestion service and process content
    const service = await getIngestionService();
    const result = await service.ingestContent({
      content,
      sourceId,
      externalId,
      title,
      metadata,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId: result.documentId,
        chunksCreated: result.chunksCreated,
        contentHash: result.contentHash,
        skipped: result.skipped ?? false,
        skipReason: result.skipReason,
      }),
      {
        status: result.skipped ? 200 : 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Knowledge Ingest API Error]', error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /api/knowledge/ingest
 * 
 * Get ingestion statistics.
 */
export const GET: APIRoute = async () => {
  try {
    const service = await getIngestionService();
    const stats = await service.getStats();

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Knowledge Ingest Stats Error]', error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
