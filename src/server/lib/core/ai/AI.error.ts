// src/server/lib/core/ai/AI.error.ts

/**
 * ERRORES DE AI - Manejo robusto de errores de proveedores LLM
 * Extiende el sistema de errores de dominio existente.
 */

import { DomainError } from '../error/Domain.error';

/**
 * Error base para todos los errores de AI
 */
export class AIError extends DomainError {
  public readonly provider: string;
  public readonly retryable: boolean;
  public readonly retryAfterMs?: number;

  constructor(
    message: string,
    provider: string,
    options?: {
      code?: string;
      retryable?: boolean;
      retryAfterMs?: number;
    }
  ) {
    super(message, options?.code ?? 'AI_ERROR');
    this.name = 'AIError';
    this.provider = provider;
    this.retryable = options?.retryable ?? false;
    this.retryAfterMs = options?.retryAfterMs;
  }
}

/**
 * Error de rate limit (429) - Reintentar después de esperar
 */
export class RateLimitError extends AIError {
  constructor(provider: string, retryAfterMs: number = 60000) {
    super(
      `Rate limit excedido en ${provider}. Reintentar en ${retryAfterMs / 1000}s`,
      provider,
      { code: 'RATE_LIMIT', retryable: true, retryAfterMs }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Error de servicio no disponible (503) - Reintentar
 */
export class ServiceUnavailableError extends AIError {
  constructor(provider: string) {
    super(
      `Servicio ${provider} temporalmente no disponible. Reintentando...`,
      provider,
      { code: 'SERVICE_UNAVAILABLE', retryable: true, retryAfterMs: 5000 }
    );
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error de API key inválida (401/403) - No reintentar
 */
export class InvalidAPIKeyError extends AIError {
  constructor(provider: string) {
    super(
      `API key inválida o sin permisos para ${provider}`,
      provider,
      { code: 'INVALID_API_KEY', retryable: false }
    );
    this.name = 'InvalidAPIKeyError';
  }
}

/**
 * Error de modelo no encontrado (404) - No reintentar
 */
export class ModelNotFoundError extends AIError {
  constructor(provider: string, model: string) {
    super(
      `Modelo "${model}" no encontrado en ${provider}`,
      provider,
      { code: 'MODEL_NOT_FOUND', retryable: false }
    );
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Error de contenido bloqueado por seguridad
 */
export class ContentFilterError extends AIError {
  constructor(provider: string) {
    super(
      `Contenido bloqueado por filtros de seguridad de ${provider}`,
      provider,
      { code: 'CONTENT_FILTERED', retryable: false }
    );
    this.name = 'ContentFilterError';
  }
}

/**
 * Parsea errores de Gemini y retorna el tipo correcto
 */
export function parseGeminiError(error: Error): AIError {
  const message = error.message;

  if (message.includes('429') || message.includes('Too Many Requests')) {
    return new RateLimitError('gemini', 60000);
  }

  if (message.includes('503') || message.includes('overloaded')) {
    return new ServiceUnavailableError('gemini');
  }

  if (message.includes('401') || message.includes('403') || message.includes('Invalid')) {
    return new InvalidAPIKeyError('gemini');
  }

  if (message.includes('404') || message.includes('not found')) {
    const modelMatch = message.match(/models\/([^\s:]+)/);
    return new ModelNotFoundError('gemini', modelMatch?.[1] ?? 'unknown');
  }

  if (message.includes('SAFETY') || message.includes('blocked')) {
    return new ContentFilterError('gemini');
  }

  // Error genérico
  return new AIError(message, 'gemini', { retryable: false });
}

/**
 * Utilidad para retry con backoff exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (error: AIError, attempt: number) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelayMs ?? 1000;
  const maxDelay = options?.maxDelayMs ?? 30000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const aiError = error instanceof AIError ? error : parseGeminiError(error as Error);
      lastError = aiError;

      if (!aiError.retryable || attempt === maxRetries) {
        throw aiError;
      }

      // Calcular delay con backoff exponencial
      const delay = Math.min(
        aiError.retryAfterMs ?? initialDelay * Math.pow(2, attempt - 1),
        maxDelay
      );

      options?.onRetry?.(aiError, attempt);
      console.log(`[AI Retry] Intento ${attempt}/${maxRetries}, esperando ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
