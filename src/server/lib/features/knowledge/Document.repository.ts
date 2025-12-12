// src/server/lib/features/knowledge/Document.repository.ts

/**
 * REPOSITORIO DOCUMENT - Implementación con Prisma
 * CRUD operations para documentos del knowledge base.
 */

import type { PrismaClient } from '@prisma/client';
import type { IDocumentRepository } from './Document.port';
import type { Document, CreateDocumentInput, UpdateDocumentInput, DocumentMetadata } from './Document.entity';
import { DocumentStatus, calculateContentHash } from './Document.entity';

export class DocumentRepository implements IDocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateDocumentInput & { contentHash: string }): Promise<Document> {
    const result = await this.prisma.kBDocument.create({
      data: {
        sourceId: input.sourceId,
        externalId: input.externalId,
        title: input.title,
        contentHash: input.contentHash,
        status: DocumentStatus.PENDING,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Document | null> {
    const result = await this.prisma.kBDocument.findUnique({
      where: { id },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findByExternalId(sourceId: string, externalId: string): Promise<Document | null> {
    const result = await this.prisma.kBDocument.findUnique({
      where: {
        sourceId_externalId: { sourceId, externalId },
      },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findBySourceId(sourceId: string): Promise<Document[]> {
    const results = await this.prisma.kBDocument.findMany({
      where: { sourceId },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findByStatus(status: DocumentStatus): Promise<Document[]> {
    const results = await this.prisma.kBDocument.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findByContentHash(contentHash: string): Promise<Document | null> {
    const result = await this.prisma.kBDocument.findFirst({
      where: { contentHash },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    const data: Record<string, unknown> = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.metadata !== undefined) {
      data.metadata = JSON.stringify(input.metadata);
    }

    const result = await this.prisma.kBDocument.update({
      where: { id },
      data,
    });

    return this.mapToEntity(result);
  }

  async updateContentHash(id: string, contentHash: string): Promise<Document> {
    const result = await this.prisma.kBDocument.update({
      where: { id },
      data: { contentHash },
    });

    return this.mapToEntity(result);
  }

  async markIndexed(id: string): Promise<Document> {
    const result = await this.prisma.kBDocument.update({
      where: { id },
      data: {
        status: DocumentStatus.INDEXED,
        indexedAt: new Date(),
      },
    });

    return this.mapToEntity(result);
  }

  async markFailed(id: string): Promise<Document> {
    const result = await this.prisma.kBDocument.update({
      where: { id },
      data: { status: DocumentStatus.FAILED },
    });

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    // Cascade delete handles chunks and embeddings
    await this.prisma.kBDocument.delete({
      where: { id },
    });
  }

  async deleteBySourceId(sourceId: string): Promise<number> {
    const result = await this.prisma.kBDocument.deleteMany({
      where: { sourceId },
    });

    return result.count;
  }

  /**
   * Mapea el resultado de Prisma a la entidad de dominio
   */
  private mapToEntity(data: {
    id: string;
    sourceId: string;
    externalId: string;
    title: string;
    contentHash: string;
    status: string;
    metadata: string | null;
    indexedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Document {
    return {
      id: data.id,
      sourceId: data.sourceId,
      externalId: data.externalId,
      title: data.title,
      contentHash: data.contentHash,
      status: data.status as DocumentStatus,
      metadata: data.metadata ? (JSON.parse(data.metadata) as DocumentMetadata) : undefined,
      indexedAt: data.indexedAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

/**
 * Helper para crear documento con hash calculado automáticamente
 */
export function createDocumentWithHash(
  input: CreateDocumentInput
): CreateDocumentInput & { contentHash: string } {
  return {
    ...input,
    contentHash: calculateContentHash(input.content),
  };
}
