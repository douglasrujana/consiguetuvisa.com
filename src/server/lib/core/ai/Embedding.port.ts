// src/server/lib/core/ai/Embedding.port.ts

/**
 * PUERTO EMBEDDINGS - Contrato para proveedores de vectorización
 * Define la interfaz para generar embeddings de texto.
 * Gemini, OpenAI, Cohere - todos deben implementar esto.
 */

/**
 * Resultado de embedding para un texto
 */
export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
}

/**
 * Resultado de embedding batch
 */
export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  usage?: {
    totalTokens: number;
  };
}

/**
 * Contrato para proveedores de embeddings.
 */
export interface IEmbeddingProvider {
  /**
   * Nombre del proveedor
   */
  readonly providerName: string;

  /**
   * Modelo de embeddings activo
   */
  readonly modelName: string;

  /**
   * Dimensiones del vector de salida
   */
  readonly dimensions: number;

  /**
   * Genera embedding para un texto
   */
  embed(text: string): Promise<EmbeddingResult>;

  /**
   * Genera embeddings para múltiples textos (batch)
   */
  embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;

  /**
   * Calcula similitud coseno entre dos vectores
   */
  cosineSimilarity(vectorA: number[], vectorB: number[]): number;

  /**
   * Verifica si el proveedor está disponible
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuración para crear un proveedor de embeddings
 */
export interface EmbeddingConfig {
  provider: 'gemini' | 'openai' | 'cohere';
  model: string;
  apiKey?: string;
}
