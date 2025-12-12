// src/server/lib/core/ai/LLM.port.ts

/**
 * PUERTO LLM - Contrato para proveedores de modelos de lenguaje
 * Define la interfaz que DEBE cumplir cualquier proveedor de LLM.
 * Gemini, OpenAI, Anthropic, Ollama - todos deben implementar esto.
 */

/**
 * Mensaje en una conversación
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Opciones para generación de texto
 */
export interface GenerateOptions {
  temperature?: number;      // 0-1, creatividad
  maxTokens?: number;        // Límite de tokens de respuesta
  topP?: number;             // Nucleus sampling
  stopSequences?: string[];  // Secuencias para detener generación
}

/**
 * Respuesta de generación de texto
 */
export interface GenerateResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Chunk para streaming
 */
export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

/**
 * Contrato para proveedores de LLM.
 * Gemini, OpenAI, Anthropic - todos deben implementar esto.
 */
export interface ILLMProvider {
  /**
   * Nombre del proveedor para logging/debugging
   */
  readonly providerName: string;

  /**
   * Modelo activo
   */
  readonly modelName: string;

  /**
   * Genera una respuesta de texto (sin streaming)
   */
  generate(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<GenerateResponse>;

  /**
   * Genera una respuesta con streaming
   */
  generateStream(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Verifica si el proveedor está disponible/configurado
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuración para crear un proveedor LLM
 */
export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;  // Para Ollama o proxies
}
