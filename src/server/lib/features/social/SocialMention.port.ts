// src/server/lib/features/social/SocialMention.port.ts

/**
 * PUERTO SOCIAL MENTION - Contrato para repositorio de menciones
 * 
 * @requirements 11.1 - CRUD para menciones sociales
 */

import type {
  SocialMention,
  CreateSocialMentionInput,
  UpdateSocialMentionInput,
  SocialMentionFilters,
} from './SocialMention.entity';

/**
 * Interface para el repositorio de menciones sociales
 */
export interface ISocialMentionRepository {
  /**
   * Crea una nueva mención social
   */
  create(input: CreateSocialMentionInput): Promise<SocialMention>;

  /**
   * Busca una mención por ID
   */
  findById(id: string): Promise<SocialMention | null>;

  /**
   * Busca una mención por plataforma y ID externo
   */
  findByExternalId(platform: string, externalId: string): Promise<SocialMention | null>;

  /**
   * Busca menciones con filtros
   */
  findMany(filters?: SocialMentionFilters, limit?: number): Promise<SocialMention[]>;

  /**
   * Busca menciones pendientes de revisión
   */
  findPendingReview(limit?: number): Promise<SocialMention[]>;

  /**
   * Busca menciones por sentimiento
   */
  findBySentiment(sentiment: string, limit?: number): Promise<SocialMention[]>;

  /**
   * Actualiza una mención
   */
  update(id: string, input: UpdateSocialMentionInput): Promise<SocialMention>;

  /**
   * Marca una mención como revisada
   */
  markAsReviewed(id: string, reviewedBy: string): Promise<SocialMention>;

  /**
   * Elimina una mención
   */
  delete(id: string): Promise<void>;

  /**
   * Cuenta menciones por sentimiento en un rango de fechas
   */
  countBySentiment(fromDate?: Date, toDate?: Date): Promise<Record<string, number>>;
}
