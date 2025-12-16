// src/server/lib/features/social/Social.graphql.ts

/**
 * DEFINICIÓN Y RESOLVERS PARA SOCIAL LISTENING
 * Separado de Alerts - este módulo es para menciones de redes sociales.
 * 
 * @requirements 11.1 - Captura de menciones
 * @requirements 11.2 - Clasificación de sentimiento
 */

import { gql } from 'graphql-tag';
import type { GraphQLContext } from '../../core/di/ContextFactory';
import { SocialMentionRepository } from './SocialMention.repository';
import type { SocialMentionFilters } from './SocialMention.entity';

// ----------------------------------------------------------------------
// 1. TYPE DEFINITIONS
// ----------------------------------------------------------------------

export const socialTypeDefs = gql`
  # Enums
  enum SentimentType {
    POSITIVE
    NEUTRAL
    NEGATIVE
    COMPLAINT
  }

  enum SocialPlatform {
    twitter
    facebook
    instagram
  }

  # Types
  type SocialMention {
    id: ID!
    sourceId: String!
    platform: SocialPlatform!
    externalId: String!
    author: String!
    content: String!
    sentiment: SentimentType!
    suggestedResponse: String
    reviewedAt: String
    reviewedBy: String
    publishedAt: String!
    createdAt: String!
  }

  type SocialStats {
    total: Int!
    pendingReview: Int!
    reviewed: Int!
    bySentiment: SentimentCount!
    byPlatform: PlatformCount!
  }

  type SentimentCount {
    POSITIVE: Int!
    NEUTRAL: Int!
    NEGATIVE: Int!
    COMPLAINT: Int!
  }

  type PlatformCount {
    twitter: Int!
    facebook: Int!
    instagram: Int!
  }

  type SentimentTrend {
    date: String!
    positive: Int!
    neutral: Int!
    negative: Int!
    complaint: Int!
  }

  # Inputs
  input SocialMentionFiltersInput {
    platform: SocialPlatform
    sentiment: SentimentType
    sourceId: String
    reviewed: Boolean
    fromDate: String
    toDate: String
  }

  input UpdateMentionInput {
    sentiment: SentimentType
    suggestedResponse: String
  }

  # Queries y Mutations
  extend type Query {
    "Obtiene menciones con filtros"
    socialMentions(filters: SocialMentionFiltersInput, limit: Int): [SocialMention!]!
    
    "Obtiene una mención por ID"
    socialMention(id: ID!): SocialMention
    
    "Menciones pendientes de revisión"
    pendingMentions(limit: Int): [SocialMention!]!
    
    "Menciones por sentimiento"
    mentionsBySentiment(sentiment: SentimentType!, limit: Int): [SocialMention!]!
    
    "Menciones por plataforma"
    mentionsByPlatform(platform: SocialPlatform!, limit: Int): [SocialMention!]!
    
    "Quejas (requieren atención)"
    complaints(limit: Int): [SocialMention!]!
    
    "Estadísticas de social listening"
    socialStats(fromDate: String, toDate: String): SocialStats!
    
    "Tendencia de sentimiento (últimos N días)"
    sentimentTrend(days: Int): [SentimentTrend!]!
  }

  extend type Mutation {
    "Marca una mención como revisada"
    reviewMention(id: ID!, reviewedBy: String!): SocialMention!
    
    "Actualiza una mención (sentimiento o respuesta)"
    updateMention(id: ID!, input: UpdateMentionInput!): SocialMention!
    
    "Elimina una mención"
    deleteMention(id: ID!): Boolean!
    
    "Regenera respuesta sugerida"
    regenerateResponse(id: ID!): SocialMention!
  }
`;

// ----------------------------------------------------------------------
// 2. RESOLVERS
// ----------------------------------------------------------------------

export const socialResolvers = {
  Query: {
    socialMentions: async (
      _: unknown,
      { filters, limit = 50 }: { filters?: SocialMentionFiltersInput; limit?: number },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const parsedFilters = filters ? parseFilters(filters) : undefined;
      const mentions = await repo.findMany(parsedFilters, limit);
      return mentions.map(mapToGraphQL);
    },

    socialMention: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mention = await repo.findById(id);
      return mention ? mapToGraphQL(mention) : null;
    },

    pendingMentions: async (
      _: unknown,
      { limit = 50 }: { limit?: number },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mentions = await repo.findPendingReview(limit);
      return mentions.map(mapToGraphQL);
    },

    mentionsBySentiment: async (
      _: unknown,
      { sentiment, limit = 50 }: { sentiment: string; limit?: number },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mentions = await repo.findBySentiment(sentiment, limit);
      return mentions.map(mapToGraphQL);
    },

    mentionsByPlatform: async (
      _: unknown,
      { platform, limit = 50 }: { platform: string; limit?: number },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mentions = await repo.findMany({ platform: platform as any }, limit);
      return mentions.map(mapToGraphQL);
    },

    complaints: async (
      _: unknown,
      { limit = 50 }: { limit?: number },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mentions = await repo.findBySentiment('COMPLAINT', limit);
      return mentions.map(mapToGraphQL);
    },

    socialStats: async (
      _: unknown,
      { fromDate, toDate }: { fromDate?: string; toDate?: string },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;

      const [all, pending, bySentiment] = await Promise.all([
        repo.findMany(undefined, 10000),
        repo.findPendingReview(10000),
        repo.countBySentiment(from, to),
      ]);

      // Contar por plataforma
      const byPlatform = { twitter: 0, facebook: 0, instagram: 0 };
      for (const m of all) {
        if (m.platform in byPlatform) {
          byPlatform[m.platform as keyof typeof byPlatform]++;
        }
      }

      return {
        total: all.length,
        pendingReview: pending.length,
        reviewed: all.length - pending.length,
        bySentiment: {
          POSITIVE: bySentiment.POSITIVE ?? 0,
          NEUTRAL: bySentiment.NEUTRAL ?? 0,
          NEGATIVE: bySentiment.NEGATIVE ?? 0,
          COMPLAINT: bySentiment.COMPLAINT ?? 0,
        },
        byPlatform,
      };
    },

    sentimentTrend: async (
      _: unknown,
      { days = 7 }: { days?: number },
      context: GraphQLContext
    ) => {
      // Obtener menciones de los últimos N días
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const mentions = await context.prisma.socialMention.findMany({
        where: { publishedAt: { gte: fromDate } },
        select: { publishedAt: true, sentiment: true },
      });

      // Agrupar por día
      const byDay: Record<string, { positive: number; neutral: number; negative: number; complaint: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        byDay[key] = { positive: 0, neutral: 0, negative: 0, complaint: 0 };
      }

      for (const m of mentions) {
        const key = m.publishedAt.toISOString().split('T')[0];
        if (byDay[key]) {
          const sentiment = m.sentiment.toLowerCase() as keyof typeof byDay[string];
          if (sentiment in byDay[key]) {
            byDay[key][sentiment]++;
          }
        }
      }

      return Object.entries(byDay)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  },

  Mutation: {
    reviewMention: async (
      _: unknown,
      { id, reviewedBy }: { id: string; reviewedBy: string },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mention = await repo.markAsReviewed(id, reviewedBy);
      return mapToGraphQL(mention);
    },

    updateMention: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateMentionInput },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mention = await repo.update(id, {
        sentiment: input.sentiment as any,
        suggestedResponse: input.suggestedResponse,
      });
      return mapToGraphQL(mention);
    },

    deleteMention: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      await repo.delete(id);
      return true;
    },

    regenerateResponse: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const repo = new SocialMentionRepository(context.prisma);
      const mention = await repo.findById(id);
      
      if (!mention) {
        throw new Error('Mención no encontrada');
      }

      // Generar nueva respuesta usando AI si está disponible
      let newResponse = 'Gracias por tu mensaje. Te responderemos pronto.';
      
      if (context.aiService) {
        try {
          newResponse = await context.aiService.prompt(
            `Genera una respuesta profesional y empática para esta mención en redes sociales: "${mention.content}"`,
            'Eres un community manager profesional. Responde de forma breve y amable.',
            { temperature: 0.7, maxTokens: 150 }
          );
        } catch (e) {
          console.error('Error generating response:', e);
        }
      }

      const updated = await repo.update(id, { suggestedResponse: newResponse });
      return mapToGraphQL(updated);
    },
  },
};

// ----------------------------------------------------------------------
// 3. HELPERS
// ----------------------------------------------------------------------

interface SocialMentionFiltersInput {
  platform?: string;
  sentiment?: string;
  sourceId?: string;
  reviewed?: boolean;
  fromDate?: string;
  toDate?: string;
}

interface UpdateMentionInput {
  sentiment?: string;
  suggestedResponse?: string;
}

function parseFilters(input: SocialMentionFiltersInput): SocialMentionFilters {
  return {
    platform: input.platform as any,
    sentiment: input.sentiment as any,
    sourceId: input.sourceId,
    reviewed: input.reviewed,
    fromDate: input.fromDate ? new Date(input.fromDate) : undefined,
    toDate: input.toDate ? new Date(input.toDate) : undefined,
  };
}

function mapToGraphQL(mention: any) {
  return {
    id: mention.id,
    sourceId: mention.sourceId,
    platform: mention.platform,
    externalId: mention.externalId,
    author: mention.author,
    content: mention.content,
    sentiment: mention.sentiment,
    suggestedResponse: mention.suggestedResponse ?? null,
    reviewedAt: mention.reviewedAt?.toISOString() ?? null,
    reviewedBy: mention.reviewedBy ?? null,
    publishedAt: mention.publishedAt.toISOString(),
    createdAt: mention.createdAt.toISOString(),
  };
}
