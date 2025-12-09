// src/server/lib/features/promo/Promo.service.ts

/**
 * SERVICIO DE PROMOCIONES (Ruleta Loca)
 * Lógica de negocio: sorteo, probabilidades, validaciones.
 */

import type { ICampaignRepository, IParticipationRepository } from './Promo.port';
import type { Campaign, Prize, SpinResult, Participation } from './Promo.entity';
import type { CreateParticipationDTO, CalculateSpinsDTO } from './Promo.dto';
import { nanoid } from 'nanoid';

export class PromoService {
  constructor(
    private readonly campaignRepo: ICampaignRepository,
    private readonly participationRepo: IParticipationRepository,
  ) {}

  // ============================================
  // CAMPAIGNS
  // ============================================

  async getCampaignBySlug(slug: string): Promise<Campaign | null> {
    const campaign = await this.campaignRepo.findBySlug(slug);
    
    if (!campaign) return null;
    
    // Validar si está activa y en fechas
    if (!this.isCampaignActive(campaign)) {
      return null;
    }
    
    return campaign;
  }

  async listActiveCampaigns(country?: string) {
    return this.campaignRepo.findAll({
      country,
      activeOnly: true,
      limit: 20,
      offset: 0,
    });
  }

  // ============================================
  // PARTICIPATIONS
  // ============================================

  async createParticipation(data: CreateParticipationDTO): Promise<Participation> {
    // 1. Obtener campaña
    const campaign = await this.campaignRepo.findBySlug(data.campaignId);
    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    // 2. Validar campaña activa
    if (!this.isCampaignActive(campaign)) {
      throw new Error('La campaña no está activa');
    }

    // 3. Validar límite de participaciones por email
    const existingCount = await this.participationRepo.countByEmail(
      data.email,
      campaign.id
    );
    
    if (existingCount >= campaign.maxParticipationsPerEmail) {
      throw new Error(`Ya alcanzaste el límite de ${campaign.maxParticipationsPerEmail} participación(es)`);
    }

    // 4. Calcular giros según tarjetas seleccionadas
    const totalSpins = this.calculateSpins(campaign, data.selectedCards);

    // 5. Crear participación
    return this.participationRepo.create({
      ...data,
      campaignId: campaign.id,
      totalSpins,
    });
  }

  async getParticipation(id: string): Promise<Participation | null> {
    return this.participationRepo.findById(id);
  }

  async getParticipationsByEmail(email: string, campaignId: string): Promise<Participation[]> {
    return this.participationRepo.findByEmail(email, campaignId);
  }


  // ============================================
  // SPIN (GIRAR RULETA)
  // ============================================

  async spin(participationId: string): Promise<SpinResult> {
    // 1. Obtener participación
    const participation = await this.participationRepo.findById(participationId);
    if (!participation) {
      return {
        success: false,
        spinsRemaining: 0,
        message: 'Participación no encontrada',
      };
    }

    // 2. Validar giros disponibles
    if (participation.spinsUsed >= participation.totalSpins) {
      return {
        success: false,
        spinsRemaining: 0,
        message: 'No tienes más giros disponibles',
      };
    }

    // 3. Obtener campaña y premios
    const campaign = await this.campaignRepo.findBySlug(participation.campaignId);
    if (!campaign) {
      // Intentar buscar por ID directo
      const prizes = await this.campaignRepo.getPrizesByCampaign(participation.campaignId);
      if (!prizes.length) {
        return {
          success: false,
          spinsRemaining: participation.totalSpins - participation.spinsUsed,
          message: 'Error al obtener premios',
        };
      }
      
      // Sortear premio
      const prize = this.selectPrize(prizes);
      return this.processSpinResult(participation, prize);
    }

    // 4. Sortear premio basado en probabilidades
    const prize = this.selectPrize(campaign.prizes);
    
    return this.processSpinResult(participation, prize);
  }

  private async processSpinResult(
    participation: Participation,
    prize: Prize | null
  ): Promise<SpinResult> {
    // Incrementar giros usados
    await this.participationRepo.incrementSpinsUsed(participation.id);
    
    const spinsRemaining = participation.totalSpins - participation.spinsUsed - 1;

    // Si no ganó o es "retry"
    if (!prize || prize.type === 'retry') {
      return {
        success: true,
        prize: prize || undefined,
        spinsRemaining,
        message: prize?.type === 'retry' 
          ? '¡Sigue participando!' 
          : 'No ganaste esta vez',
      };
    }

    // Generar código único de premio
    const prizeCode = this.generatePrizeCode();

    // Actualizar participación con el premio
    await this.participationRepo.updateSpinResult(
      participation.id,
      prize.id,
      prize.name,
      prizeCode
    );

    return {
      success: true,
      prize,
      prizeCode,
      spinsRemaining,
      message: `¡Felicidades! Ganaste: ${prize.name}`,
    };
  }

  // ============================================
  // PRIZE MANAGEMENT
  // ============================================

  async verifyPrize(prizeCode: string, verifiedBy?: string): Promise<Participation | null> {
    const participation = await this.participationRepo.findByPrizeCode(prizeCode);
    if (!participation) return null;

    if (participation.prizeStatus !== 'PENDING') {
      throw new Error(`Premio ya está en estado: ${participation.prizeStatus}`);
    }

    return this.participationRepo.verifyPrize(prizeCode, verifiedBy);
  }

  async deliverPrize(prizeCode: string): Promise<Participation | null> {
    const participation = await this.participationRepo.findByPrizeCode(prizeCode);
    if (!participation) return null;

    if (participation.prizeStatus !== 'VERIFIED') {
      throw new Error('El premio debe estar verificado antes de entregar');
    }

    return this.participationRepo.deliverPrize(prizeCode);
  }

  async getPrizeByCode(prizeCode: string): Promise<Participation | null> {
    return this.participationRepo.findByPrizeCode(prizeCode);
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Calcula el total de giros según las tarjetas seleccionadas
   */
  calculateSpins(campaign: Campaign, selectedCards: string[]): number {
    let totalSpins = 0;

    for (const cardSlug of selectedCards) {
      const cardBrand = campaign.cardBrands.find(cb => cb.slug === cardSlug);
      if (cardBrand) {
        totalSpins += cardBrand.spinsPerCard;
      } else {
        // Si no encuentra la marca, dar 1 giro por defecto
        totalSpins += 1;
      }
    }

    return Math.max(1, totalSpins); // Mínimo 1 giro
  }

  /**
   * Calcula giros sin necesidad de la campaña completa
   */
  async calculateSpinsForCards(data: CalculateSpinsDTO): Promise<number> {
    const campaign = await this.campaignRepo.findBySlug(data.campaignId);
    if (!campaign) return data.selectedCards.length;
    
    return this.calculateSpins(campaign, data.selectedCards);
  }

  /**
   * Selecciona un premio basado en probabilidades
   */
  private selectPrize(prizes: Prize[]): Prize | null {
    if (!prizes.length) return null;

    // Filtrar premios con inventario disponible
    const availablePrizes = prizes.filter(p => p.inventory === -1 || p.inventory > 0);
    if (!availablePrizes.length) return null;

    // Normalizar probabilidades
    const totalProbability = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
    
    // Generar número aleatorio
    const random = Math.random() * totalProbability;
    
    // Seleccionar premio
    let cumulative = 0;
    for (const prize of availablePrizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }

    // Fallback: último premio disponible
    return availablePrizes[availablePrizes.length - 1];
  }

  /**
   * Valida si una campaña está activa
   */
  private isCampaignActive(campaign: Campaign): boolean {
    if (!campaign.isActive) return false;
    
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    return now >= start && now <= end;
  }

  /**
   * Genera código único para premio
   */
  private generatePrizeCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(6).toUpperCase();
    return `PREMIO-${timestamp}-${random}`;
  }

  // ============================================
  // ADMIN / REPORTS
  // ============================================

  async getParticipationsByCampaign(
    campaignId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Participation[]> {
    return this.participationRepo.findByCampaign(campaignId, options);
  }

  async getCampaignStats(campaignId: string) {
    const participations = await this.participationRepo.findByCampaign(campaignId, { limit: 10000 });
    
    const stats = {
      totalParticipations: participations.length,
      totalSpins: participations.reduce((sum, p) => sum + p.spinsUsed, 0),
      prizesWon: participations.filter(p => p.prizeId && p.prizeStatus !== 'EXPIRED').length,
      prizesVerified: participations.filter(p => p.prizeStatus === 'VERIFIED').length,
      prizesDelivered: participations.filter(p => p.prizeStatus === 'DELIVERED').length,
      bySource: {
        web: participations.filter(p => p.source === 'WEB').length,
        kiosk: participations.filter(p => p.source === 'KIOSK').length,
      },
    };

    return stats;
  }
}
