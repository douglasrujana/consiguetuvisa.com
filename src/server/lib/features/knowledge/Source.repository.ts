// src/server/lib/features/knowledge/Source.repository.ts

/**
 * REPOSITORIO SOURCE - Implementación con Prisma
 * CRUD operations para fuentes de datos.
 */

import type { PrismaClient } from '@prisma/client';
import type { ISourceRepository } from './Source.port';
import type { Source, CreateSourceInput, UpdateSourceInput, SourceConfig } from './Source.entity';
import { SourceType } from './Source.entity';

export class SourceRepository implements ISourceRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateSourceInput): Promise<Source> {
    const result = await this.prisma.source.create({
      data: {
        type: input.type,
        name: input.name,
        config: JSON.stringify(input.config),
        isActive: input.isActive ?? true,
      },
    });

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Source | null> {
    const result = await this.prisma.source.findUnique({
      where: { id },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<Source[]> {
    const results = await this.prisma.source.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findByType(type: SourceType): Promise<Source[]> {
    const results = await this.prisma.source.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findActive(): Promise<Source[]> {
    const results = await this.prisma.source.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async update(id: string, input: UpdateSourceInput): Promise<Source> {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.config !== undefined) {
      data.config = JSON.stringify(input.config);
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const result = await this.prisma.source.update({
      where: { id },
      data,
    });

    return this.mapToEntity(result);
  }

  async updateLastSyncAt(id: string): Promise<void> {
    await this.prisma.source.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.source.delete({
      where: { id },
    });
  }

  async deactivate(id: string): Promise<Source> {
    const result = await this.prisma.source.update({
      where: { id },
      data: { isActive: false },
    });

    return this.mapToEntity(result);
  }

  /**
   * Mapea el resultado de Prisma a la entidad de dominio
   */
  private mapToEntity(data: {
    id: string;
    type: string;
    name: string;
    config: string;
    isActive: boolean;
    lastSyncAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Source {
    return {
      id: data.id,
      type: data.type as SourceType,
      name: data.name,
      config: JSON.parse(data.config) as SourceConfig,
      isActive: data.isActive,
      lastSyncAt: data.lastSyncAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
