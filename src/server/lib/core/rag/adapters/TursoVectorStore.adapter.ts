// src/server/lib/core/rag/adapters/TursoVectorStore.adapter.ts

/**
 * ADAPTADOR TURSO VECTOR STORE
 * Implementación persistente usando Prisma + Turso/SQLite.
 * Almacena embeddings como Bytes y calcula similitud coseno en memoria.
 * 
 * **Feature: rag-knowledge-system, Property 5: Vector Store Persistence**
 * **Feature: rag-knowledge-system, Property 6: Similarity Search Self-Match**
 * **Feature: rag-knowledge-system, Property 7: Cascade Delete Integrity**
 */

import type { PrismaClient } from '@prisma/client';
import type {
  IVectorStore,
  VectorDocument,
  SearchResult,
  SearchOptions,
} from '../VectorStore.port';

/**
 * Configuración para TursoVectorStore
 */
export interface TursoVectorStoreConfig {
  prisma: PrismaClient;
  model?: string;      // Modelo de embedding (default: "text-embedding-004")
  dimensions?: number; // Dimensiones del vector (default: 768)
}

export class TursoVectorStoreAdapter implements IVectorStore {
  readonly providerName = 'turso';

  private prisma: PrismaClient;
  private model: string;
  private dimensions: number;

  constructor(config: TursoVectorStoreConfig) {
    this.prisma = config.prisma;
    this.model = config.model ?? 'text-embedding-004';
    this.dimensions = config.dimensions ?? 768;
  }

  /**
   * Serializa un array de números a Bytes (Buffer)
   */
  private serializeVector(vector: number[]): Buffer {
    const float32Array = new Float32Array(vector);
    return Buffer.from(float32Array.buffer);
  }

  /**
   * Deserializa Bytes a array de números
   */
  private deserializeVector(bytes: Buffer): number[] {
    const float32Array = new Float32Array(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    return Array.from(float32Array);
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

  async upsert(doc: VectorDocument): Promise<void> {
    const vectorBytes = this.serializeVector(doc.embedding);
    const metadataJson = doc.metadata ? JSON.stringify(doc.metadata) : null;

    // Usar transacción para garantizar consistencia
    await this.prisma.$transaction(async (tx) => {
      // Buscar chunk existente por ID
      const existingChunk = await tx.chunk.findUnique({
        where: { id: doc.id },
        include: { embedding: true },
      });

      if (existingChunk) {
        // Actualizar chunk existente
        await tx.chunk.update({
          where: { id: doc.id },
          data: {
            content: doc.content,
            metadata: metadataJson,
          },
        });

        // Actualizar o crear embedding
        if (existingChunk.embedding) {
          await tx.embedding.update({
            where: { chunkId: doc.id },
            data: {
              vector: vectorBytes,
              model: this.model,
              dimensions: this.dimensions,
            },
          });
        } else {
          await tx.embedding.create({
            data: {
              chunkId: doc.id,
              vector: vectorBytes,
              model: this.model,
              dimensions: this.dimensions,
            },
          });
        }
      } else {
        // Crear nuevo chunk con embedding
        // Necesitamos un documento padre - crear uno temporal si no existe
        let documentId = doc.metadata?.documentId as string | undefined;

        if (!documentId) {
          // Crear documento temporal para chunks huérfanos
          const tempDoc = await tx.kBDocument.upsert({
            where: {
              sourceId_externalId: {
                sourceId: 'temp-source',
                externalId: `temp-${doc.id}`,
              },
            },
            create: {
              externalId: `temp-${doc.id}`,
              title: 'Temporary Document',
              contentHash: doc.id,
              source: {
                connectOrCreate: {
                  where: { id: 'temp-source' },
                  create: {
                    id: 'temp-source',
                    type: 'MANUAL',
                    name: 'Temporary Source',
                    config: '{}',
                  },
                },
              },
            },
            update: {},
          });
          documentId = tempDoc.id;
        }

        await tx.chunk.create({
          data: {
            id: doc.id,
            documentId,
            content: doc.content,
            position: 0,
            metadata: metadataJson,
            embedding: {
              create: {
                vector: vectorBytes,
                model: this.model,
                dimensions: this.dimensions,
              },
            },
          },
        });
      }
    });
  }

  async upsertBatch(docs: VectorDocument[]): Promise<void> {
    // Procesar en lotes para evitar timeouts
    for (const doc of docs) {
      await this.upsert(doc);
    }
  }

  async search(queryVector: number[], options?: SearchOptions): Promise<SearchResult[]> {
    const topK = options?.topK ?? 5;
    const minScore = options?.minScore ?? 0.7;

    // Obtener todos los embeddings con sus chunks
    const embeddings = await this.prisma.embedding.findMany({
      include: {
        chunk: true,
      },
    });

    const results: SearchResult[] = [];

    for (const embedding of embeddings) {
      const storedVector = this.deserializeVector(embedding.vector);
      const score = this.cosineSimilarity(queryVector, storedVector);

      if (score >= minScore) {
        const metadata = embedding.chunk.metadata
          ? (JSON.parse(embedding.chunk.metadata) as Record<string, unknown>)
          : undefined;

        // Aplicar filtros de metadata si existen
        if (options?.filter && !this.matchesFilter(metadata, options.filter)) {
          continue;
        }

        results.push({
          id: embedding.chunk.id,
          content: embedding.chunk.content,
          score,
          metadata,
        });
      }
    }

    // Ordenar por score descendente y limitar
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async delete(id: string): Promise<void> {
    // El cascade delete está configurado en Prisma schema
    // Eliminar el chunk eliminará automáticamente el embedding
    await this.prisma.chunk.delete({
      where: { id },
    }).catch(() => {
      // Ignorar si no existe
    });
  }

  async deleteBatch(ids: string[]): Promise<void> {
    await this.prisma.chunk.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async get(id: string): Promise<VectorDocument | null> {
    const chunk = await this.prisma.chunk.findUnique({
      where: { id },
      include: { embedding: true },
    });

    if (!chunk || !chunk.embedding) {
      return null;
    }

    const embedding = this.deserializeVector(chunk.embedding.vector);
    const metadata = chunk.metadata
      ? (JSON.parse(chunk.metadata) as Record<string, unknown>)
      : undefined;

    return {
      id: chunk.id,
      content: chunk.content,
      embedding,
      metadata,
    };
  }

  async count(): Promise<number> {
    return this.prisma.embedding.count();
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Elimina todos los embeddings de un documento específico
   * Útil para re-indexación
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    // Los embeddings se eliminan en cascada cuando se eliminan los chunks
    await this.prisma.chunk.deleteMany({
      where: { documentId },
    });
  }

  /**
   * Obtiene estadísticas del vector store
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    totalChunks: number;
    totalDocuments: number;
  }> {
    const [totalEmbeddings, totalChunks, totalDocuments] = await Promise.all([
      this.prisma.embedding.count(),
      this.prisma.chunk.count(),
      this.prisma.kBDocument.count(),
    ]);

    return { totalEmbeddings, totalChunks, totalDocuments };
  }
}
