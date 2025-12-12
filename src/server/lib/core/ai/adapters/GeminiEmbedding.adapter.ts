// src/server/lib/core/ai/adapters/GeminiEmbedding.adapter.ts

/**
 * ADAPTADOR GEMINI EMBEDDINGS
 * Implementa IEmbeddingProvider usando Google Gemini API.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  IEmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
} from '../Embedding.port';

export class GeminiEmbeddingAdapter implements IEmbeddingProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;
  readonly dimensions = 768; // text-embedding-004 default

  private client: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(apiKey?: string, model: string = 'text-embedding-004') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.modelName = model;
    this.client = new GoogleGenerativeAI(key);
    this.model = this.client.getGenerativeModel({ model: this.modelName });
  }

  async embed(text: string): Promise<EmbeddingResult> {
    try {
      const result = await this.model.embedContent(text);
      const vector = result.embedding.values;

      return {
        vector,
        dimensions: vector.length,
      };
    } catch (error) {
      console.error('[GeminiEmbedding] Error embedding:', error);
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    try {
      // Gemini no tiene batch nativo, procesamos secuencialmente
      const embeddings: EmbeddingResult[] = [];

      for (const text of texts) {
        const result = await this.embed(text);
        embeddings.push(result);
      }

      return {
        embeddings,
        usage: {
          totalTokens: texts.reduce((acc, t) => acc + t.length / 4, 0), // Estimación
        },
      };
    } catch (error) {
      console.error('[GeminiEmbedding] Error batch embedding:', error);
      throw error;
    }
  }

  cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.embed('test');
      return true;
    } catch {
      return false;
    }
  }
}
