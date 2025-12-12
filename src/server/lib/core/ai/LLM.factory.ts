// src/server/lib/core/ai/LLM.factory.ts

/**
 * FACTORY LLM - Crea instancias de proveedores LLM
 * Permite cambiar de proveedor sin modificar la lógica de negocio.
 */

import type { ILLMProvider, LLMConfig } from './LLM.port';
import type { IEmbeddingProvider, EmbeddingConfig } from './Embedding.port';
import { GeminiLLMAdapter } from './adapters/GeminiLLM.adapter';
import { GeminiEmbeddingAdapter } from './adapters/GeminiEmbedding.adapter';

/**
 * Crea un proveedor LLM según la configuración
 */
export function createLLM(config: LLMConfig): ILLMProvider {
  switch (config.provider) {
    case 'gemini':
      return new GeminiLLMAdapter(config.apiKey, config.model);

    case 'openai':
      // TODO: Implementar OpenAILLMAdapter
      throw new Error('OpenAI adapter not implemented yet');

    case 'anthropic':
      // TODO: Implementar AnthropicLLMAdapter
      throw new Error('Anthropic adapter not implemented yet');

    case 'ollama':
      // TODO: Implementar OllamaLLMAdapter
      throw new Error('Ollama adapter not implemented yet');

    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

/**
 * Crea un proveedor de Embeddings según la configuración
 */
export function createEmbedding(config: EmbeddingConfig): IEmbeddingProvider {
  switch (config.provider) {
    case 'gemini':
      return new GeminiEmbeddingAdapter(config.apiKey, config.model);

    case 'openai':
      // TODO: Implementar OpenAIEmbeddingAdapter
      throw new Error('OpenAI embedding adapter not implemented yet');

    case 'cohere':
      // TODO: Implementar CohereEmbeddingAdapter
      throw new Error('Cohere embedding adapter not implemented yet');

    default:
      throw new Error(`Unknown embedding provider: ${config.provider}`);
  }
}

/**
 * Configuraciones predefinidas para casos de uso comunes
 */
export const LLMPresets = {
  /** Chat conversacional - Gemini 2.5 Flash Lite (rápido y económico) */
  chat: (): ILLMProvider =>
    createLLM({ provider: 'gemini', model: 'gemini-2.5-flash-lite' }),

  /** Análisis profundo - Gemini 2.5 Flash (más capaz) */
  analysis: (): ILLMProvider =>
    createLLM({ provider: 'gemini', model: 'gemini-2.5-flash' }),

  /** Embeddings para RAG */
  embeddings: (): IEmbeddingProvider =>
    createEmbedding({ provider: 'gemini', model: 'text-embedding-004' }),
};

/**
 * Singleton para reutilizar instancias
 */
const instances = new Map<string, ILLMProvider | IEmbeddingProvider>();

export function getLLM(config: LLMConfig): ILLMProvider {
  const key = `llm:${config.provider}:${config.model}`;
  if (!instances.has(key)) {
    instances.set(key, createLLM(config));
  }
  return instances.get(key) as ILLMProvider;
}

export function getEmbedding(config: EmbeddingConfig): IEmbeddingProvider {
  const key = `emb:${config.provider}:${config.model}`;
  if (!instances.has(key)) {
    instances.set(key, createEmbedding(config));
  }
  return instances.get(key) as IEmbeddingProvider;
}
