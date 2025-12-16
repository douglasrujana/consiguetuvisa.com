// src/server/lib/features/alerts/Alert.graphql.ts

/**
 * DEFINICIÓN Y RESOLVERS PARA LA FEATURE DE ALERTS
 * Tipos GraphQL para alertas y notificaciones.
 * 
 * @requirements 8.1 - API GraphQL Unificada
 * @requirements 12.1 - Sistema de alertas y notificaciones
 */

import { gql } from 'graphql-tag';
import type { GraphQLContext } from '../../core/di/ContextFactory';

// ----------------------------------------------------------------------
// 1. TYPE DEFINITIONS DE ALERTS
// ----------------------------------------------------------------------

export const alertTypeDefs = gql`
  # Enums
  enum AlertType {
    COMPLAINT
    POLICY_CHANGE
    SYSTEM_ERROR
    MENTION
  }

  enum AlertPriority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  # Types
  type AlertDomain {
    id: ID!
    name: String!
    displayName: String!
    description: String
    icon: String
    color: String
    allowedRoles: [String!]!
    isActive: Boolean!
  }

  type Alert {
    id: ID!
    type: AlertType!
    priority: AlertPriority!
    domain: AlertDomain!
    title: String!
    content: String!
    context: String
    sourceId: String
    mentionId: String
    acknowledgedAt: String
    acknowledgedBy: String
    createdAt: String!
  }

  type AlertStats {
    total: Int!
    pending: Int!
    acknowledged: Int!
    byType: AlertTypeCount!
    byPriority: AlertPriorityCount!
  }

  type AlertTypeCount {
    COMPLAINT: Int!
    POLICY_CHANGE: Int!
    SYSTEM_ERROR: Int!
    MENTION: Int!
  }

  type AlertPriorityCount {
    LOW: Int!
    MEDIUM: Int!
    HIGH: Int!
    CRITICAL: Int!
  }

  # Inputs
  input AlertFiltersInput {
    type: AlertType
    priority: AlertPriority
    domainName: String
    acknowledged: Boolean
    sourceId: String
    mentionId: String
    fromDate: String
    toDate: String
  }

  input CreateAlertInput {
    type: AlertType!
    priority: AlertPriority!
    domainName: String!
    title: String!
    content: String!
    context: String
    sourceId: String
    mentionId: String
  }

  # Queries y Mutations
  extend type Query {
    "Obtiene todas las alertas con filtros opcionales"
    alerts(filters: AlertFiltersInput, limit: Int): [Alert!]!
    
    "Obtiene una alerta por ID"
    alert(id: ID!): Alert
    
    "Obtiene alertas pendientes (no reconocidas)"
    pendingAlerts(limit: Int): [Alert!]!
    
    "Obtiene alertas por tipo"
    alertsByType(type: AlertType!, limit: Int): [Alert!]!
    
    "Obtiene alertas por prioridad"
    alertsByPriority(priority: AlertPriority!, limit: Int): [Alert!]!
    
    "Estadísticas de alertas"
    alertStats(fromDate: String, toDate: String): AlertStats!
    
    "Obtiene todos los dominios de alertas"
    alertDomains: [AlertDomain!]!
    
    "Obtiene alertas por dominio"
    alertsByDomain(domainName: String!, limit: Int): [Alert!]!
  }

  extend type Mutation {
    "Crea una nueva alerta"
    createAlert(input: CreateAlertInput!): Alert!
    
    "Reconoce una alerta"
    acknowledgeAlert(id: ID!, acknowledgedBy: String!): Alert!
    
    "Elimina una alerta"
    deleteAlert(id: ID!): Boolean!
  }
`;

// ----------------------------------------------------------------------
// 2. RESOLVERS DE ALERTS
// ----------------------------------------------------------------------

export const alertResolvers = {
  Query: {
    alerts: async (
      _: unknown,
      { filters, limit = 50 }: { filters?: AlertFiltersInput; limit?: number },
      context: GraphQLContext
    ) => {
      const parsedFilters = filters ? parseAlertFilters(filters) : undefined;
      const alerts = await context.alertRepository.findMany(parsedFilters, limit);
      return alerts.map(mapAlertToGraphQL);
    },

    alert: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const alert = await context.alertRepository.findById(id);
      return alert ? mapAlertToGraphQL(alert) : null;
    },

    pendingAlerts: async (
      _: unknown,
      { limit = 50 }: { limit?: number },
      context: GraphQLContext
    ) => {
      const alerts = await context.alertRepository.findPending(limit);
      return alerts.map(mapAlertToGraphQL);
    },

    alertsByType: async (
      _: unknown,
      { type, limit = 50 }: { type: string; limit?: number },
      context: GraphQLContext
    ) => {
      const alerts = await context.alertRepository.findByType(type, limit);
      return alerts.map(mapAlertToGraphQL);
    },

    alertsByPriority: async (
      _: unknown,
      { priority, limit = 50 }: { priority: string; limit?: number },
      context: GraphQLContext
    ) => {
      const alerts = await context.alertRepository.findByPriority(priority, limit);
      return alerts.map(mapAlertToGraphQL);
    },

    alertStats: async (
      _: unknown,
      { fromDate, toDate }: { fromDate?: string; toDate?: string },
      context: GraphQLContext
    ) => {
      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;

      const [allAlerts, pendingAlerts, byType, byPriority] = await Promise.all([
        context.alertRepository.findMany(undefined, 10000),
        context.alertRepository.findPending(10000),
        context.alertRepository.countByType(from, to),
        context.alertRepository.countByPriority(from, to),
      ]);

      return {
        total: allAlerts.length,
        pending: pendingAlerts.length,
        acknowledged: allAlerts.length - pendingAlerts.length,
        byType: {
          COMPLAINT: byType.COMPLAINT ?? 0,
          POLICY_CHANGE: byType.POLICY_CHANGE ?? 0,
          SYSTEM_ERROR: byType.SYSTEM_ERROR ?? 0,
          MENTION: byType.MENTION ?? 0,
        },
        byPriority: {
          LOW: byPriority.LOW ?? 0,
          MEDIUM: byPriority.MEDIUM ?? 0,
          HIGH: byPriority.HIGH ?? 0,
          CRITICAL: byPriority.CRITICAL ?? 0,
        },
      };
    },

    alertDomains: async (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.alertRepository.findAllDomains();
    },

    alertsByDomain: async (
      _: unknown,
      { domainName, limit = 50 }: { domainName: string; limit?: number },
      context: GraphQLContext
    ) => {
      const alerts = await context.alertRepository.findByDomain(domainName, limit);
      return alerts.map(mapAlertToGraphQL);
    },
  },

  Mutation: {
    createAlert: async (
      _: unknown,
      { input }: { input: CreateAlertInput },
      context: GraphQLContext
    ) => {
      const alert = await context.alertRepository.create({
        type: input.type,
        priority: input.priority,
        domainName: input.domainName,
        title: input.title,
        content: input.content,
        context: input.context ? JSON.parse(input.context) : undefined,
        sourceId: input.sourceId,
        mentionId: input.mentionId,
      });
      return mapAlertToGraphQL(alert);
    },

    acknowledgeAlert: async (
      _: unknown,
      { id, acknowledgedBy }: { id: string; acknowledgedBy: string },
      context: GraphQLContext
    ) => {
      const alert = await context.alertRepository.acknowledge(id, acknowledgedBy);
      return mapAlertToGraphQL(alert);
    },

    deleteAlert: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      await context.alertRepository.delete(id);
      return true;
    },
  },
};

// ----------------------------------------------------------------------
// 3. HELPER TYPES & MAPPERS
// ----------------------------------------------------------------------

interface AlertFiltersInput {
  type?: string;
  priority?: string;
  acknowledged?: boolean;
  sourceId?: string;
  mentionId?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateAlertInput {
  type: string;
  priority: string;
  domainName: string;
  title: string;
  content: string;
  context?: string;
  sourceId?: string;
  mentionId?: string;
}

function parseAlertFilters(input: AlertFiltersInput) {
  return {
    type: input.type,
    priority: input.priority,
    acknowledged: input.acknowledged,
    sourceId: input.sourceId,
    mentionId: input.mentionId,
    fromDate: input.fromDate ? new Date(input.fromDate) : undefined,
    toDate: input.toDate ? new Date(input.toDate) : undefined,
  };
}

interface AlertWithDomain {
  id: string;
  type: string;
  priority: string;
  title: string;
  content: string;
  context?: Record<string, unknown> | string | null;
  sourceId?: string | null;
  mentionId?: string | null;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: string | null;
  createdAt: Date;
  domain?: {
    id: string;
    name: string;
    displayName: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    allowedRoles: string[]; // Already parsed by repository
    isActive: boolean;
  };
}

function mapAlertToGraphQL(alert: AlertWithDomain) {
  return {
    id: alert.id,
    type: alert.type,
    priority: alert.priority,
    domain: alert.domain ? {
      id: alert.domain.id,
      name: alert.domain.name,
      displayName: alert.domain.displayName,
      description: alert.domain.description,
      icon: alert.domain.icon,
      color: alert.domain.color,
      allowedRoles: alert.domain.allowedRoles, // Already parsed by repository
      isActive: alert.domain.isActive,
    } : null,
    title: alert.title,
    content: alert.content,
    context: typeof alert.context === 'string' ? alert.context : (alert.context ? JSON.stringify(alert.context) : null),
    sourceId: alert.sourceId ?? null,
    mentionId: alert.mentionId ?? null,
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: alert.acknowledgedBy ?? null,
    createdAt: alert.createdAt.toISOString(),
  };
}
