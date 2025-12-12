// src/server/lib/core/rag/adapters/MemoryVectorStore.adapter.ts

/**
 * ADAPTADOR MEMORY VECTOR STORE
 * Implementación en memoria para desarrollo y pruebas.
 * NO usar en producción - los datos se pierden al reiniciar.
 */

import type {
  IVectorStore,
  VectorDocument,
  SearchResult,
  SearchOptions,
} from '../VectorStore.port';

export class MemoryVectorStoreAdapter implements IVectorStore {
  readonly providerName = 'memory';

  private store: Map<string, VectorDocument> = new Map();

  async upsert(doc: VectorDocument): Promise<void> {
    this.store.set(doc.id, doc);
  }

  async upsertBatch(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      this.store.set(doc.id, doc);
    }
  }

  async search(queryVector: number[], options?: SearchOptions): Promise<SearchResult[]> {
    const topK = options?.topK ?? 5;
    const minScore = options?.minScore ?? 0.7;

    const results: SearchResult[] = [];

    for (const doc of this.store.values()) {
      const score = this.cosineSimilarity(queryVector, doc.embedding);

      if (score >= minScore) {
        // Aplicar filtros de metadata si existen
        if (options?.filter && !this.matchesFilter(doc.metadata, options.filter)) {
          continue;
        }

        results.push({
          id: doc.id,
          content: doc.content,
          score,
          metadata: doc.metadata,
        });
      }
    }

    // Ordenar por score descendente y limitar
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async deleteBatch(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.store.delete(id);
    }
  }

  async get(id: string): Promise<VectorDocument | null> {
    return this.store.get(id) ?? null;
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Calcula similitud coseno entre dos vectores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Verifica si metadata cumple con los filtros
   */
  private matchesFilter(
    metadata: Record<string, unknown> | undefined,
    filter: Record<string, unknown>
  ): boolean {
    if (!metadata) return false;

    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) return false;
    }
    return true;
  }

  /**
   * Limpia todo el store (útil para tests)
   */
  clear(): void {
    this.store.clear();
  }
}
