// src/server/lib/features/promo/Participation.repository.ts

/**
 * REPOSITORIO DE PARTICIPACIONES (Prisma/Turso)
 * Implementa IParticipationRepository usando Prisma.
 */

import { prisma } from '@db/prisma-singleton';
import type { IParticipationRepository } from './Promo.port';
import type { Participation } from './Promo.entity';
import type { CreateParticipationDTO } from './Promo.dto';
import { nanoid } from 'nanoid';

export class ParticipationRepository implements IParticipationRepository {
  
  async create(data: CreateParticipationDTO & { totalSpins: number }): Promise<Participation> {
    const result = await prisma.participation.create({
      data: {
        campaignId: data.campaignId,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        country: data.country,
        selectedCards: JSON.stringify(data.selectedCards),
        totalSpins: data.totalSpins,
        spinsUsed: 0,
        source: data.source,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Participation | null> {
    const result = await prisma.participation.findUnique({
      where: { id },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findByEmail(email: string, campaignId: string): Promise<Participation[]> {
    const results = await prisma.participation.findMany({
      where: {
        email: email.toLowerCase(),
        campaignId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map(this.mapToEntity);
  }

  async findByPrizeCode(prizeCode: string): Promise<Participation | null> {
    const result = await prisma.participation.findUnique({
      where: { prizeCode },
    });

    return result ? this.mapToEntity(result) : null;
  }

  async countByEmail(email: string, campaignId: string): Promise<number> {
    return prisma.participation.count({
      where: {
        email: email.toLowerCase(),
        campaignId,
      },
    });
  }

  async updateSpinResult(
    id: string,
    prizeId: string | null,
    prizeName: string | null,
    prizeCode: string | null
  ): Promise<Participation> {
    const result = await prisma.participation.update({
      where: { id },
      data: {
        prizeId,
        prizeName,
        prizeCode,
        prizeStatus: prizeId ? 'PENDING' : 'PENDING',
      },
    });

    return this.mapToEntity(result);
  }

  async incrementSpinsUsed(id: string): Promise<Participation> {
    const result = await prisma.participation.update({
      where: { id },
      data: {
        spinsUsed: { increment: 1 },
      },
    });

    return this.mapToEntity(result);
  }

  async verifyPrize(prizeCode: string, verifiedBy?: string): Promise<Participation> {
    const result = await prisma.participation.update({
      where: { prizeCode },
      data: {
        prizeStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy,
      },
    });

    return this.mapToEntity(result);
  }

  async deliverPrize(prizeCode: string): Promise<Participation> {
    const result = await prisma.participation.update({
      where: { prizeCode },
      data: {
        prizeStatus: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    return this.mapToEntity(result);
  }

  async findByCampaign(
    campaignId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<Participation[]> {
    const results = await prisma.participation.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
    });

    return results.map(this.mapToEntity);
  }

  // ============================================
  // MAPPER
  // ============================================

  private mapToEntity(data: any): Participation {
    return {
      id: data.id,
      campaignId: data.campaignId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      selectedCards: JSON.parse(data.selectedCards || '[]'),
      totalSpins: data.totalSpins,
      spinsUsed: data.spinsUsed,
      prizeId: data.prizeId ?? undefined,
      prizeName: data.prizeName ?? undefined,
      prizeCode: data.prizeCode ?? undefined,
      prizeStatus: data.prizeStatus,
      verifiedAt: data.verifiedAt ?? undefined,
      verifiedBy: data.verifiedBy ?? undefined,
      deliveredAt: data.deliveredAt ?? undefined,
      crmLeadId: data.crmLeadId ?? undefined,
      ipAddress: data.ipAddress ?? undefined,
      userAgent: data.userAgent ?? undefined,
      source: data.source,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

// Helper para generar códigos únicos de premio
export function generatePrizeCode(): string {
  return `PRIZE-${nanoid(10).toUpperCase()}`;
}
