// src/server/lib/features/alerts/Alert.repository.ts

/**
 * REPOSITORIO ALERT - Implementación con Prisma
 * CRUD operations para alertas del sistema.
 * 
 * @requirements 12.1 - Gestión de alertas y notificaciones
 */

import type { PrismaClient, AlertType as PrismaAlertType, AlertPriority as PrismaAlertPriority } from '@prisma/client';
import type { IAlertRepository } from './Alert.port';
import type {
  Alert,
  AlertDomain,
  CreateAlertInput,
  UpdateAlertInput,
  AlertFilters,
} from './Alert.entity';
import { AlertType, AlertPriority } from './Alert.entity';

// Include domain in all queries
const INCLUDE_DOMAIN = { domain: true };

export class AlertRepository implements IAlertRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAlertInput): Promise<Alert> {
    // Get domain by name or use default 'operations'
    const domainName = input.domainName || 'operations';
    const domain = await this.prisma.alertDomain.findUnique({ where: { name: domainName } });
    if (!domain) throw new Error(`Domain '${domainName}' not found`);

    const result = await this.prisma.alert.create({
      data: {
        type: input.type as PrismaAlertType,
        priority: input.priority as PrismaAlertPriority,
        domainId: domain.id,
        title: input.title,
        content: input.content,
        context: input.context ? JSON.stringify(input.context) : null,
        sourceId: input.sourceId,
        mentionId: input.mentionId,
      },
      include: INCLUDE_DOMAIN,
    });

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Alert | null> {
    const result = await this.prisma.alert.findUnique({
      where: { id },
      include: INCLUDE_DOMAIN,
    });

    return result ? this.mapToEntity(result) : null;
  }

  // AlertDomain methods
  async findAllDomains(): Promise<AlertDomain[]> {
    const domains = await this.prisma.alertDomain.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return domains.map(d => ({
      id: d.id,
      name: d.name,
      displayName: d.displayName,
      description: d.description ?? undefined,
      icon: d.icon ?? undefined,
      color: d.color ?? undefined,
      allowedRoles: this.parseRoles(d.allowedRoles),
      isActive: d.isActive,
    }));
  }

  async findByDomain(domainName: string, limit = 50): Promise<Alert[]> {
    const domain = await this.prisma.alertDomain.findUnique({ where: { name: domainName } });
    if (!domain) return [];

    const results = await this.prisma.alert.findMany({
      where: { domainId: domain.id },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: INCLUDE_DOMAIN,
    });

    return results.map(r => this.mapToEntity(r));
  }

  async findMany(filters?: AlertFilters, limit = 50): Promise<Alert[]> {
    const where: Record<string, unknown> = {};

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.acknowledged !== undefined) {
      where.acknowledgedAt = filters.acknowledged ? { not: null } : null;
    }
    if (filters?.sourceId) {
      where.sourceId = filters.sourceId;
    }
    if (filters?.mentionId) {
      where.mentionId = filters.mentionId;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        (where.createdAt as Record<string, Date>).gte = filters.fromDate;
      }
      if (filters.toDate) {
        (where.createdAt as Record<string, Date>).lte = filters.toDate;
      }
    }

    const results = await this.prisma.alert.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: INCLUDE_DOMAIN,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findPending(limit = 50): Promise<Alert[]> {
    const results = await this.prisma.alert.findMany({
      where: { acknowledgedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: INCLUDE_DOMAIN,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findByType(type: string, limit = 50): Promise<Alert[]> {
    const results = await this.prisma.alert.findMany({
      where: { type: type as PrismaAlertType },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: INCLUDE_DOMAIN,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async findByPriority(priority: string, limit = 50): Promise<Alert[]> {
    const results = await this.prisma.alert.findMany({
      where: { priority: priority as PrismaAlertPriority },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: INCLUDE_DOMAIN,
    });

    return results.map((r) => this.mapToEntity(r));
  }

  async update(id: string, input: UpdateAlertInput): Promise<Alert> {
    const data: Record<string, unknown> = {};

    if (input.priority !== undefined) {
      data.priority = input.priority;
    }
    if (input.acknowledgedAt !== undefined) {
      data.acknowledgedAt = input.acknowledgedAt;
    }
    if (input.acknowledgedBy !== undefined) {
      data.acknowledgedBy = input.acknowledgedBy;
    }

    const result = await this.prisma.alert.update({
      where: { id },
      data,
    });

    return this.mapToEntity(result);
  }

  async acknowledge(id: string, acknowledgedBy: string): Promise<Alert> {
    const result = await this.prisma.alert.update({
      where: { id },
      data: { acknowledgedAt: new Date(), acknowledgedBy },
      include: INCLUDE_DOMAIN,
    });

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alert.delete({
      where: { id },
    });
  }

  async countByType(fromDate?: Date, toDate?: Date): Promise<Record<string, number>> {
    const where: Record<string, unknown> = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        (where.createdAt as Record<string, Date>).gte = fromDate;
      }
      if (toDate) {
        (where.createdAt as Record<string, Date>).lte = toDate;
      }
    }

    const results = await this.prisma.alert.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
    });

    const counts: Record<string, number> = {
      [AlertType.COMPLAINT]: 0,
      [AlertType.POLICY_CHANGE]: 0,
      [AlertType.SYSTEM_ERROR]: 0,
      [AlertType.MENTION]: 0,
    };

    for (const result of results) {
      counts[result.type] = result._count.type;
    }

    return counts;
  }

  async countByPriority(fromDate?: Date, toDate?: Date): Promise<Record<string, number>> {
    const where: Record<string, unknown> = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        (where.createdAt as Record<string, Date>).gte = fromDate;
      }
      if (toDate) {
        (where.createdAt as Record<string, Date>).lte = toDate;
      }
    }

    const results = await this.prisma.alert.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    const counts: Record<string, number> = {
      [AlertPriority.LOW]: 0,
      [AlertPriority.MEDIUM]: 0,
      [AlertPriority.HIGH]: 0,
      [AlertPriority.CRITICAL]: 0,
    };

    for (const result of results) {
      counts[result.priority] = result._count.priority;
    }

    return counts;
  }

  private parseRoles(roles: string | null | undefined): string[] {
    if (!roles) return [];
    try {
      const parsed = JSON.parse(roles);
      return Array.isArray(parsed) ? parsed : [roles];
    } catch {
      // Handle comma-separated string fallback
      return roles.split(',').map(r => r.trim());
    }
  }

  private mapToEntity(data: {
    id: string;
    type: string;
    priority: string;
    title: string;
    content: string;
    context: string | null;
    sourceId: string | null;
    mentionId: string | null;
    acknowledgedAt: Date | null;
    acknowledgedBy: string | null;
    createdAt: Date;
    domain?: {
      id: string;
      name: string;
      displayName: string;
      description: string | null;
      icon: string | null;
      color: string | null;
      allowedRoles: string;
      isActive: boolean;
    };
  }): Alert {
    return {
      id: data.id,
      type: data.type as AlertType,
      priority: data.priority as AlertPriority,
      domain: data.domain ? {
        id: data.domain.id,
        name: data.domain.name,
        displayName: data.domain.displayName,
        description: data.domain.description ?? undefined,
        icon: data.domain.icon ?? undefined,
        color: data.domain.color ?? undefined,
        allowedRoles: this.parseRoles(data.domain.allowedRoles),
        isActive: data.domain.isActive,
      } : undefined,
      title: data.title,
      content: data.content,
      context: data.context ? JSON.parse(data.context) : undefined,
      sourceId: data.sourceId ?? undefined,
      mentionId: data.mentionId ?? undefined,
      acknowledgedAt: data.acknowledgedAt ?? undefined,
      acknowledgedBy: data.acknowledgedBy ?? undefined,
      createdAt: data.createdAt,
    };
  }
}
