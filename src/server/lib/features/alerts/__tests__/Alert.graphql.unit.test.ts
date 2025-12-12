// src/server/lib/features/alerts/__tests__/Alert.graphql.unit.test.ts

/**
 * UNIT TESTS FOR ALERT GRAPHQL RESOLVERS
 * Tests that queries and mutations return expected shapes.
 * 
 * @requirements 8.1 - API GraphQL Unificada
 * @requirements 12.1 - Sistema de alertas y notificaciones
 */

import { describe, test, expect, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../../../db/prisma-singleton';
import { alertResolvers } from '../Alert.graphql';
import { AlertRepository } from '../Alert.repository';
import type { GraphQLContext } from '../../../core/di/ContextFactory';

// Create test context
function createTestContext(): GraphQLContext {
  const alertRepository = new AlertRepository(prisma);

  return {
    request: new Request('http://localhost'),
    authService: {} as any,
    userService: {} as any,
    leadService: {} as any,
    solicitudService: {} as any,
    pageService: {} as any,
    blogService: {} as any,
    aiService: {} as any,
    sourceRepository: {} as any,
    sourceService: {} as any,
    documentRepository: {} as any,
    alertRepository,
    ragService: {} as any,
    ingestionService: {} as any,
    prisma,
  };
}

describe('Alert GraphQL Resolvers - Unit Tests', () => {
  let context: GraphQLContext;

  afterAll(async () => {
    await prisma.alert.deleteMany({});
  });

  beforeEach(async () => {
    context = createTestContext();
    await prisma.alert.deleteMany({});
  });

  describe('Query: alerts', () => {
    test('should return empty array when no alerts exist', async () => {
      const result = await alertResolvers.Query.alerts(null, {}, context);
      expect(result).toEqual([]);
    });

    test('should return all alerts with correct shape', async () => {
      await prisma.alert.create({
        data: {
          type: 'COMPLAINT',
          priority: 'HIGH',
          title: 'Test Alert',
          content: 'Test content',
        },
      });

      const result = await alertResolvers.Query.alerts(null, {}, context);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type', 'COMPLAINT');
      expect(result[0]).toHaveProperty('priority', 'HIGH');
      expect(result[0]).toHaveProperty('title', 'Test Alert');
      expect(result[0]).toHaveProperty('content', 'Test content');
      expect(result[0]).toHaveProperty('createdAt');
    });

    test('should filter alerts by type', async () => {
      await prisma.alert.createMany({
        data: [
          { type: 'COMPLAINT', priority: 'HIGH', title: 'Complaint', content: 'c1' },
          { type: 'MENTION', priority: 'LOW', title: 'Mention', content: 'c2' },
        ],
      });

      const result = await alertResolvers.Query.alerts(
        null,
        { filters: { type: 'COMPLAINT' } },
        context
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('COMPLAINT');
    });
  });

  describe('Query: alert', () => {
    test('should return null for non-existent alert', async () => {
      const result = await alertResolvers.Query.alert(
        null,
        { id: 'non-existent-id' },
        context
      );
      expect(result).toBeNull();
    });

    test('should return alert by ID with correct shape', async () => {
      const created = await prisma.alert.create({
        data: {
          type: 'POLICY_CHANGE',
          priority: 'CRITICAL',
          title: 'Policy Update',
          content: 'Important policy change',
        },
      });

      const result = await alertResolvers.Query.alert(
        null,
        { id: created.id },
        context
      );

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: created.id,
        type: 'POLICY_CHANGE',
        priority: 'CRITICAL',
        title: 'Policy Update',
        content: 'Important policy change',
      });
    });
  });

  describe('Query: pendingAlerts', () => {
    test('should return only unacknowledged alerts', async () => {
      await prisma.alert.createMany({
        data: [
          { type: 'COMPLAINT', priority: 'HIGH', title: 'Pending', content: 'c1' },
          { 
            type: 'MENTION', 
            priority: 'LOW', 
            title: 'Acknowledged', 
            content: 'c2',
            acknowledgedAt: new Date(),
            acknowledgedBy: 'admin',
          },
        ],
      });

      const result = await alertResolvers.Query.pendingAlerts(null, {}, context);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Pending');
      // acknowledgedAt can be undefined or null when not set
      expect(result[0].acknowledgedAt == null).toBe(true);
    });
  });

  describe('Query: alertsByType', () => {
    test('should return alerts filtered by type', async () => {
      await prisma.alert.createMany({
        data: [
          { type: 'SYSTEM_ERROR', priority: 'HIGH', title: 'Error 1', content: 'c1' },
          { type: 'SYSTEM_ERROR', priority: 'MEDIUM', title: 'Error 2', content: 'c2' },
          { type: 'COMPLAINT', priority: 'LOW', title: 'Complaint', content: 'c3' },
        ],
      });

      const result = await alertResolvers.Query.alertsByType(
        null,
        { type: 'SYSTEM_ERROR' },
        context
      );

      expect(result).toHaveLength(2);
      result.forEach((alert: any) => {
        expect(alert.type).toBe('SYSTEM_ERROR');
      });
    });
  });

  describe('Query: alertsByPriority', () => {
    test('should return alerts filtered by priority', async () => {
      await prisma.alert.createMany({
        data: [
          { type: 'COMPLAINT', priority: 'CRITICAL', title: 'Critical 1', content: 'c1' },
          { type: 'MENTION', priority: 'CRITICAL', title: 'Critical 2', content: 'c2' },
          { type: 'SYSTEM_ERROR', priority: 'LOW', title: 'Low', content: 'c3' },
        ],
      });

      const result = await alertResolvers.Query.alertsByPriority(
        null,
        { priority: 'CRITICAL' },
        context
      );

      expect(result).toHaveLength(2);
      result.forEach((alert: any) => {
        expect(alert.priority).toBe('CRITICAL');
      });
    });
  });

  describe('Query: alertStats', () => {
    test('should return statistics with correct shape', async () => {
      await prisma.alert.createMany({
        data: [
          { type: 'COMPLAINT', priority: 'HIGH', title: 'A1', content: 'c1' },
          { type: 'COMPLAINT', priority: 'CRITICAL', title: 'A2', content: 'c2' },
          { 
            type: 'MENTION', 
            priority: 'LOW', 
            title: 'A3', 
            content: 'c3',
            acknowledgedAt: new Date(),
            acknowledgedBy: 'admin',
          },
        ],
      });

      const result = await alertResolvers.Query.alertStats(null, {}, context);

      expect(result).toHaveProperty('total', 3);
      expect(result).toHaveProperty('pending', 2);
      expect(result).toHaveProperty('acknowledged', 1);
      expect(result.byType).toHaveProperty('COMPLAINT', 2);
      expect(result.byType).toHaveProperty('MENTION', 1);
      expect(result.byPriority).toHaveProperty('HIGH', 1);
      expect(result.byPriority).toHaveProperty('CRITICAL', 1);
      expect(result.byPriority).toHaveProperty('LOW', 1);
    });
  });

  describe('Mutation: createAlert', () => {
    test('should create alert and return correct shape', async () => {
      const result = await alertResolvers.Mutation.createAlert(
        null,
        {
          input: {
            type: 'COMPLAINT',
            priority: 'HIGH',
            title: 'New Complaint',
            content: 'Customer complaint details',
            context: JSON.stringify({ customerId: '123' }),
          },
        },
        context
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type', 'COMPLAINT');
      expect(result).toHaveProperty('priority', 'HIGH');
      expect(result).toHaveProperty('title', 'New Complaint');
      expect(result).toHaveProperty('content', 'Customer complaint details');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('Mutation: acknowledgeAlert', () => {
    test('should acknowledge alert and return correct shape', async () => {
      const created = await prisma.alert.create({
        data: {
          type: 'COMPLAINT',
          priority: 'HIGH',
          title: 'To Acknowledge',
          content: 'Content',
        },
      });

      const result = await alertResolvers.Mutation.acknowledgeAlert(
        null,
        { id: created.id, acknowledgedBy: 'admin@example.com' },
        context
      );

      expect(result).toMatchObject({
        id: created.id,
        acknowledgedBy: 'admin@example.com',
      });
      expect(result.acknowledgedAt).toBeDefined();
    });
  });

  describe('Mutation: deleteAlert', () => {
    test('should delete alert and return true', async () => {
      const created = await prisma.alert.create({
        data: {
          type: 'MENTION',
          priority: 'LOW',
          title: 'To Delete',
          content: 'Content',
        },
      });

      const result = await alertResolvers.Mutation.deleteAlert(
        null,
        { id: created.id },
        context
      );

      expect(result).toBe(true);

      // Verify deletion
      const deleted = await prisma.alert.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });
  });
});
