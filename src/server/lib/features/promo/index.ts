// src/server/lib/features/promo/index.ts

/**
 * FEATURE: PROMO (Ruleta Loca)
 * Exportaciones públicas del módulo.
 */

// Entidades
export * from './Promo.entity';

// DTOs
export * from './Promo.dto';

// Puertos (interfaces)
export * from './Promo.port';

// Repositorios
export { CampaignRepository } from './Campaign.repository';
export { ParticipationRepository, generatePrizeCode } from './Participation.repository';

// Servicio
export { PromoService } from './Promo.service';

// GraphQL
export { promoTypeDefs, promoResolvers } from './Promo.graphql';
