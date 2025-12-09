// src/server/lib/features/promo/Promo.port.ts

/**
 * PUERTOS (INTERFACES) DEL DOMINIO PROMO
 * Contratos que deben implementar los adaptadores.
 */

import type { 
  Campaign, 
  CampaignSummary, 
  Prize, 
  CardBrand,
  Participation,
  SpinResult 
} from './Promo.entity';
import type { 
  ListCampaignsDTO, 
  CreateParticipationDTO 
} from './Promo.dto';

// ============================================
// CAMPAIGN REPOSITORY (Sanity)
// ============================================

export interface ICampaignRepository {
  findBySlug(slug: string): Promise<Campaign | null>;
  findAll(options: ListCampaignsDTO): Promise<CampaignSummary[]>;
  exists(slug: string): Promise<boolean>;
  getCardBrandsByCountry(country: string): Promise<CardBrand[]>;
  getPrizesByCampaign(campaignId: string): Promise<Prize[]>;
  decrementPrizeInventory(prizeId: string): Promise<boolean>;
}

// ============================================
// PARTICIPATION REPOSITORY (Prisma/Turso)
// ============================================

export interface IParticipationRepository {
  create(data: CreateParticipationDTO & { totalSpins: number }): Promise<Participation>;
  findById(id: string): Promise<Participation | null>;
  findByEmail(email: string, campaignId: string): Promise<Participation[]>;
  findByPrizeCode(prizeCode: string): Promise<Participation | null>;
  countByEmail(email: string, campaignId: string): Promise<number>;
  updateSpinResult(
    id: string, 
    prizeId: string | null, 
    prizeName: string | null,
    prizeCode: string | null
  ): Promise<Participation>;
  incrementSpinsUsed(id: string): Promise<Participation>;
  verifyPrize(prizeCode: string, verifiedBy?: string): Promise<Participation>;
  deliverPrize(prizeCode: string): Promise<Participation>;
  findByCampaign(campaignId: string, options?: { limit?: number; offset?: number }): Promise<Participation[]>;
}
