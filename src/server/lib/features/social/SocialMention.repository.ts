// src/server/lib/features/social/SocialMention.repository.ts

/**
 * REPOSITORIO SOCIAL MENTION - Implementación con Prisma
 * CRUD operations para menciones sociales.
 * 
 * @requirements 11.1 - Captura y almacenamiento de menciones
 */

import type { PrismaClient, SentimentType as PrismaSentimentType } from '@prisma/client';
import type { ISocialMentionRepository } from './SocialMention.port';
import type {
  SocialMention,
  CreateSocialMentionInput,
  UpdateSocialMentionInput,
  SocialMentionFilters,
  SocialPlatform,
} from './SocialMention.entity';
import { SentimentType } from './SocialMention.entity';

export class SocialMentionRepository implements ISocialMentionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateSocialMentionInput): Promise<SocialMention> {
    const result = await this.prisma.socialMention.create({
      data: {
        sourceId: input.sourceId,
        platform: input.platform,
        externalId: input.externalId,
        author: input.author,
        content: input.content,
        sentiment: input.sentiment as PrismaSentimentType,
        suggestedResponse: input.suggestedResponse,
        publishedAt: input.publishedAt,
      },
    });

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<SocialMention | null> {
    const result = await this.prisma.socialMention.findUnique({
      where: { id },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findByExternalId(platform: string, externalId: string): Promise<SocialMention | null> {
    const result = await this.prisma.socialMention.findUnique({
      where: {
        platform_externalId: { platform, externalId },
      },
    });

    return result ? this.mapToEntity(result) : null;
  }


  async findMany(filters?: SocialMentionFilters, limit = 50): Promise<SocialMention[]> {
    const where: Record<string, unknown> = {};

    if (filters?.platform) {
      where.platform = filters.platform;
    }
    if (filters?.sentiment) {
      where.sentiment = filters.sentiment;
    }
    if (filters?.sourceId) {
      where.sourceId = filters.sourceId;
    }
    if (filters?.reviewed !== undefined) {
      where.reviewedAt = filters.reviewed ? { not: null } : null;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.publishedAt = {};
      if (filters.fromDate) {
        (where.publishedAt as Record<string, Date>).gte = filters.fromDate;
      }
      if (filters.toDate) {
        (where.publishedAt as Record<string, Date>).lte = filters.toDate;
      }
    }

    const results = await this.prisma.socialMention.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findPendingReview(limit = 50): Promise<SocialMention[]> {
    const results = await this.prisma.socialMention.findMany({
      where: { reviewedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findBySentiment(sentiment: string, limit = 50): Promise<SocialMention[]> {
    const results = await this.prisma.socialMention.findMany({
      where: { sentiment: sentiment as PrismaSentimentType },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async update(id: string, input: UpdateSocialMentionInput): Promise<SocialMention> {
    const data: Record<string, unknown> = {};

    if (input.sentiment !== undefined) {
      data.sentiment = input.sentiment;
    }
    if (input.suggestedResponse !== undefined) {
      data.suggestedResponse = input.suggestedResponse;
    }
    if (input.reviewedAt !== undefined) {
      data.reviewedAt = input.reviewedAt;
    }
    if (input.reviewedBy !== undefined) {
      data.reviewedBy = input.reviewedBy;
    }

    const result = await this.prisma.socialMention.update({
      where: { id },
      data,
    });

    return this.mapToEntity(result);
  }

  async markAsReviewed(id: string, reviewedBy: string): Promise<SocialMention> {
    const result = await this.prisma.socialMention.update({
      where: { id },
      data: {
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.socialMention.delete({
      where: { id },
    });
  }

  async countBySentiment(fromDate?: Date, toDate?: Date): Promise<Record<string, number>> {
    const where: Record<string, unknown> = {};

    if (fromDate || toDate) {
      where.publishedAt = {};
      if (fromDate) {
        (where.publishedAt as Record<string, Date>).gte = fromDate;
      }
      if (toDate) {
        (where.publishedAt as Record<string, Date>).lte = toDate;
      }
    }

    const results = await this.prisma.socialMention.groupBy({
      by: ['sentiment'],
      where,
      _count: { sentiment: true },
    });

    const counts: Record<string, number> = {
      [SentimentType.POSITIVE]: 0,
      [SentimentType.NEUTRAL]: 0,
      [SentimentType.NEGATIVE]: 0,
      [SentimentType.COMPLAINT]: 0,
    };

    for (const result of results) {
      counts[result.sentiment] = result._count.sentiment;
    }

    return counts;
  }

  /**
   * Mapea el resultado de Prisma a la entidad de dominio
   */
  private mapToEntity(data: {
    id: string;
    sourceId: string;
    platform: string;
    externalId: string;
    author: string;
    content: string;
    sentiment: string;
    suggestedResponse: string | null;
    reviewedAt: Date | null;
    reviewedBy: string | null;
    publishedAt: Date;
    createdAt: Date;
  }): SocialMention {
    return {
      id: data.id,
      sourceId: data.sourceId,
      platform: data.platform as SocialPlatform,
      externalId: data.externalId,
      author: data.author,
      content: data.content,
      sentiment: data.sentiment as SentimentType,
      suggestedResponse: data.suggestedResponse ?? undefined,
      reviewedAt: data.reviewedAt ?? undefined,
      reviewedBy: data.reviewedBy ?? undefined,
      publishedAt: data.publishedAt,
      createdAt: data.createdAt,
    };
  }
}
