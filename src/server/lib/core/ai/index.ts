// src/server/lib/core/ai/index.ts

/**
 * CORE AI - Exportaciones públicas
 */

// Ports (Interfaces)
export type {
  ILLMProvider,
  ChatMessage,
  GenerateOptions,
  GenerateResponse,
  StreamChunk,
  LLMConfig,
} from './LLM.port';

export type {
  IEmbeddingProvider,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingConfig,
} from './Embedding.port';

// Factory
export { createLLM, createEmbedding, getLLM, getEmbedding, LLMPresets } from './LLM.factory';

// Service
export { AIService, type AIServiceConfig } from './AI.service';

// Adapters (para uso directo si es necesario)
export { GeminiLLMAdapter } from './adapters/GeminiLLM.adapter';
export { GeminiEmbeddingAdapter } from './adapters/GeminiEmbedding.adapter';

// Errors
export {
  AIError,
  RateLimitError,
  ServiceUnavailableError,
  InvalidAPIKeyError,
  ModelNotFoundError,
  ContentFilterError,
  parseGeminiError,
  withRetry,
} from './AI.error';
