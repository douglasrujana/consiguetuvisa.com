// src/server/lib/core/rag/RAG.service.ts

/**
 * SERVICIO RAG - Orquesta el pipeline Retrieval-Augmented Generation
 * Retrieve → Augment → Generate
 */

import type {
  IRAGEngine,
  DocumentChunk,
  RAGResponse,
  RAGQueryOptions,
  RetrievedContext,
} from './RAG.port';
import type { IVectorStore, VectorDocument } from './VectorStore.port';
import type { ILLMProvider, ChatMessage } from '../ai/LLM.port';
import type { IEmbeddingProvider } from '../ai/Embedding.port';
import { nanoid } from 'nanoid';

export interface RAGServiceConfig {
  vectorStore: IVectorStore;
  llm: ILLMProvider;
  embedding: IEmbeddingProvider;
  defaultSystemPrompt?: string;
}

export class RAGService implements IRAGEngine {
  private vectorStore: IVectorStore;
  private llm: ILLMProvider;
  private embedding: IEmbeddingProvider;
  private defaultSystemPrompt: string;

  constructor(config: RAGServiceConfig) {
    this.vectorStore = config.vectorStore;
    this.llm = config.llm;
    this.embedding = config.embedding;
    this.defaultSystemPrompt =
      config.defaultSystemPrompt ??
      `Eres un asistente experto de ConsigueTuVisa.com, una agencia de viajes especializada en trámites de visa.
Responde SOLO basándote en el contexto proporcionado. Si no encuentras la información, di "No tengo información sobre eso".
Sé conciso, profesional y amable. Responde en español.`;
  }

  async indexDocument(doc: DocumentChunk): Promise<void> {
    const embeddingResult = await this.embedding.embed(doc.content);

    const vectorDoc: VectorDocument = {
      id: doc.id || nanoid(),
      content: doc.content,
      embedding: embeddingResult.vector,
      metadata: {
        source: doc.source,
        ...doc.metadata,
      },
    };

    await this.vectorStore.upsert(vectorDoc);
  }

  async indexDocuments(docs: DocumentChunk[]): Promise<void> {
    // Procesar en batches para no exceder rate limits
    const batchSize = 10;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);

      const vectorDocs: VectorDocument[] = await Promise.all(
        batch.map(async (doc) => {
          const embeddingResult = await this.embedding.embed(doc.content);
          return {
            id: doc.id || nanoid(),
            content: doc.content,
            embedding: embeddingResult.vector,
            metadata: {
              source: doc.source,
              ...doc.metadata,
            },
          };
        })
      );

      await this.vectorStore.upsertBatch(vectorDocs);
    }
  }

  async query(question: string, options?: RAGQueryOptions): Promise<RAGResponse> {
    // 1. RETRIEVE - Buscar contexto relevante
    const context = await this.retrieve(question, options);

    if (context.chunks.length === 0) {
      return {
        answer: 'No encontré información relevante para responder tu pregunta.',
        sources: [],
      };
    }

    // 2. AUGMENT - Construir prompt con contexto
    const contextText = context.chunks
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    const systemPrompt = options?.systemPrompt ?? this.defaultSystemPrompt;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n\n--- CONTEXTO ---\n${contextText}\n--- FIN CONTEXTO ---`,
      },
    ];

    // Agregar historial si existe
    if (options?.includeHistory) {
      messages.push(...options.includeHistory);
    }

    messages.push({ role: 'user', content: question });

    // 3. GENERATE - Generar respuesta
    const response = await this.llm.generate(messages, {
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 1024,
    });

    return {
      answer: response.content,
      sources: context.chunks.map((c) => ({
        content: c.content.substring(0, 200) + '...',
        source: (c.metadata?.source as string) ?? 'unknown',
        score: c.score,
      })),
      usage: response.usage,
    };
  }

  async retrieve(question: string, options?: RAGQueryOptions): Promise<RetrievedContext> {
    // Generar embedding de la pregunta
    const queryEmbedding = await this.embedding.embed(question);

    // Buscar chunks similares
    const results = await this.vectorStore.search(queryEmbedding.vector, {
      topK: options?.topK ?? 5,
      minScore: options?.minScore ?? 0.7,
    });

    // Calcular tokens aproximados
    const totalTokens = results.reduce((acc, r) => acc + Math.ceil(r.content.length / 4), 0);

    return {
      chunks: results,
      totalTokens,
    };
  }

  async deleteBySource(source: string): Promise<number> {
    // Para implementar correctamente necesitaríamos un método de búsqueda por metadata
    // Por ahora retornamos 0
    console.warn('[RAG] deleteBySource not fully implemented');
    return 0;
  }

  async getStats(): Promise<{ totalDocuments: number; totalChunks: number }> {
    const count = await this.vectorStore.count();
    return {
      totalDocuments: count,
      totalChunks: count,
    };
  }
}
