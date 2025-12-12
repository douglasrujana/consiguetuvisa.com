// src/server/lib/core/ai/AI.service.ts

/**
 * SERVICIO AI - Orquesta proveedores LLM y Embeddings
 * Capa de abstracción para toda la funcionalidad de IA.
 */

import type { ILLMProvider, ChatMessage, GenerateOptions, GenerateResponse, StreamChunk } from './LLM.port';
import type { IEmbeddingProvider, EmbeddingResult, BatchEmbeddingResult } from './Embedding.port';
import { LLMPresets } from './LLM.factory';

export interface AIServiceConfig {
  llmProvider?: ILLMProvider;
  embeddingProvider?: IEmbeddingProvider;
}

export class AIService {
  private llm: ILLMProvider;
  private embedding: IEmbeddingProvider;

  constructor(config?: AIServiceConfig) {
    // Usar presets por defecto si no se especifica
    this.llm = config?.llmProvider ?? LLMPresets.chat();
    this.embedding = config?.embeddingProvider ?? LLMPresets.embeddings();
  }

  // ============ LLM Methods ============

  /**
   * Genera una respuesta de chat
   */
  async chat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<GenerateResponse> {
    return this.llm.generate(messages, options);
  }

  /**
   * Genera una respuesta simple (sin historial)
   */
  async prompt(
    prompt: string,
    systemPrompt?: string,
    options?: GenerateOptions
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.llm.generate(messages, options);
    return response.content;
  }

  /**
   * Genera respuesta con streaming
   */
  async *chatStream(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    yield* this.llm.generateStream(messages, options);
  }

  // ============ Embedding Methods ============

  /**
   * Genera embedding para un texto
   */
  async embed(text: string): Promise<EmbeddingResult> {
    return this.embedding.embed(text);
  }

  /**
   * Genera embeddings para múltiples textos
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    return this.embedding.embedBatch(texts);
  }

  /**
   * Calcula similitud entre dos textos
   */
  async similarity(textA: string, textB: string): Promise<number> {
    const [embA, embB] = await Promise.all([
      this.embedding.embed(textA),
      this.embedding.embed(textB),
    ]);
    return this.embedding.cosineSimilarity(embA.vector, embB.vector);
  }

  // ============ Utility Methods ============

  /**
   * Verifica disponibilidad de los proveedores
   */
  async healthCheck(): Promise<{ llm: boolean; embedding: boolean }> {
    const [llmOk, embOk] = await Promise.all([
      this.llm.isAvailable(),
      this.embedding.isAvailable(),
    ]);
    return { llm: llmOk, embedding: embOk };
  }

  /**
   * Info de los proveedores activos
   */
  getProviderInfo(): { llm: string; embedding: string } {
    return {
      llm: `${this.llm.providerName}/${this.llm.modelName}`,
      embedding: `${this.embedding.providerName}/${this.embedding.modelName}`,
    };
  }

  /**
   * Cambia el proveedor LLM en runtime
   */
  setLLMProvider(provider: ILLMProvider): void {
    this.llm = provider;
  }

  /**
   * Cambia el proveedor de embeddings en runtime
   */
  setEmbeddingProvider(provider: IEmbeddingProvider): void {
    this.embedding = provider;
  }
}
