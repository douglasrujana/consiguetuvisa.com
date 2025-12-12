// src/server/lib/core/rag/VectorStore.port.ts

/**
 * PUERTO VECTOR STORE - Contrato para almacenamiento de vectores
 * Define la interfaz para guardar y buscar embeddings.
 * Turso, Pinecone, Qdrant - todos deben implementar esto.
 */

/**
 * Documento con su embedding
 */
export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Resultado de búsqueda por similitud
 */
export interface SearchResult {
  id: string;
  content: string;
  score: number; // 0-1, similitud coseno
  metadata?: Record<string, unknown>;
}

/**
 * Opciones de búsqueda
 */
export interface SearchOptions {
  topK?: number; // Número de resultados (default: 5)
  minScore?: number; // Score mínimo para incluir (default: 0.7)
  filter?: Record<string, unknown>; // Filtros por metadata
}

/**
 * Contrato para proveedores de Vector Store.
 */
export interface IVectorStore {
  /**
   * Nombre del proveedor
   */
  readonly providerName: string;

  /**
   * Inserta un documento con su embedding
   */
  upsert(doc: VectorDocument): Promise<void>;

  /**
   * Inserta múltiples documentos
   */
  upsertBatch(docs: VectorDocument[]): Promise<void>;

  /**
   * Busca documentos similares por vector
   */
  search(queryVector: number[], options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Elimina un documento por ID
   */
  delete(id: string): Promise<void>;

  /**
   * Elimina múltiples documentos
   */
  deleteBatch(ids: string[]): Promise<void>;

  /**
   * Obtiene un documento por ID
   */
  get(id: string): Promise<VectorDocument | null>;

  /**
   * Cuenta total de documentos
   */
  count(): Promise<number>;

  /**
   * Verifica conexión
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuración para crear un Vector Store
 */
export interface VectorStoreConfig {
  provider: 'turso' | 'memory' | 'pinecone';
  dimensions: number; // Dimensiones del embedding (768 para Gemini)
  connectionString?: string;
  apiKey?: string;
}
