// src/server/lib/features/social/SocialMention.entity.ts

/**
 * ENTIDADES DE SOCIAL MENTION
 * Modelos de dominio para monitoreo de menciones en redes sociales.
 * 
 * @requirements 11.1 - Captura de menciones con metadata
 */

/**
 * Tipos de sentimiento para clasificación de menciones
 */
export enum SentimentType {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  COMPLAINT = 'COMPLAINT',
}

/**
 * Plataformas sociales soportadas
 */
export type SocialPlatform = 'twitter' | 'facebook' | 'instagram';

/**
 * Entidad SocialMention - Mención de marca en redes sociales
 */
export interface SocialMention {
  id: string;
  sourceId: string;
  platform: SocialPlatform;
  externalId: string;
  author: string;
  content: string;
  sentiment: SentimentType;
  suggestedResponse?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  publishedAt: Date;
  createdAt: Date;
}

/**
 * Input para crear una nueva mención social
 */
export interface CreateSocialMentionInput {
  sourceId: string;
  platform: SocialPlatform;
  externalId: string;
  author: string;
  content: string;
  sentiment: SentimentType;
  suggestedResponse?: string;
  publishedAt: Date;
}

/**
 * Input para actualizar una mención social
 */
export interface UpdateSocialMentionInput {
  sentiment?: SentimentType;
  suggestedResponse?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

/**
 * Filtros para búsqueda de menciones
 */
export interface SocialMentionFilters {
  platform?: SocialPlatform;
  sentiment?: SentimentType;
  sourceId?: string;
  reviewed?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Resultado de clasificación de sentimiento
 */
export interface SentimentClassificationResult {
  sentiment: SentimentType;
  confidence: number;
  reasoning?: string;
}

/**
 * Resultado de generación de respuesta sugerida
 */
export interface SuggestedResponseResult {
  response: string;
  requiresReview: boolean;
  context?: string;
}
