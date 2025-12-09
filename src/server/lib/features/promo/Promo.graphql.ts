// src/server/lib/features/promo/Promo.graphql.ts

/**
 * GRAPHQL SCHEMA Y RESOLVERS - PROMO (Ruleta Loca)
 */

import { gql } from 'graphql-tag';
import { PromoService } from './Promo.service';
import { CampaignRepository } from './Campaign.repository';
import { ParticipationRepository } from './Participation.repository';
import { 
  CreateParticipationSchema, 
  SpinWheelSchema,
  VerifyPrizeSchema,
  CalculateSpinsSchema 
} from './Promo.dto';

// Instanciar servicio con repositorios
const campaignRepo = new CampaignRepository();
const participationRepo = new ParticipationRepository();
const promoService = new PromoService(campaignRepo, participationRepo);

// ============================================
// TYPE DEFINITIONS
// ============================================

export const promoTypeDefs = gql`
  # === TYPES ===
  
  type Campaign {
    id: String!
    name: String!
    slug: String!
    description: String
    country: String!
    startDate: String!
    endDate: String!
    maxParticipationsPerEmail: Int!
    prizes: [Prize!]!
    cardBrands: [CardBrand!]!
    agencyInfo: AgencyInfo
    theme: CampaignTheme
    isActive: Boolean!
  }

  type CampaignSummary {
    id: String!
    name: String!
    slug: String!
    country: String!
    startDate: String!
    endDate: String!
    isActive: Boolean!
  }

  type Prize {
    id: String!
    name: String!
    description: String
    type: String!
    value: Float
    image: SanityImage
    color: String
    probability: Float!
    inventory: Int!
    expirationDays: Int!
  }

  type CardBrand {
    id: String!
    name: String!
    slug: String!
    logo: SanityImage!
    variants: [CardVariant!]
    countries: [String!]!
    spinsPerCard: Int!
    order: Int!
  }

  type CardVariant {
    name: String!
    tier: String!
    logo: SanityImage
    spinsBonus: Int!
  }

  type AgencyInfo {
    name: String
    address: String
    phone: String
    whatsapp: String
    ruc: String
    website: String
    logo: SanityImage
    photo: SanityImage
  }

  type CampaignTheme {
    primaryColor: String
    secondaryColor: String
    backgroundImage: SanityImage
  }

  type SanityImage {
    _type: String
    asset: SanityAsset
  }

  type SanityAsset {
    _ref: String
    _type: String
  }

  type Participation {
    id: String!
    campaignId: String!
    name: String!
    email: String!
    phone: String!
    country: String!
    selectedCards: [String!]!
    totalSpins: Int!
    spinsUsed: Int!
    prizeId: String
    prizeName: String
    prizeCode: String
    prizeStatus: String!
    source: String!
    createdAt: String!
  }

  type SpinResult {
    success: Boolean!
    prize: Prize
    prizeCode: String
    spinsRemaining: Int!
    message: String!
  }

  type CampaignStats {
    totalParticipations: Int!
    totalSpins: Int!
    prizesWon: Int!
    prizesVerified: Int!
    prizesDelivered: Int!
    bySource: SourceStats!
  }

  type SourceStats {
    web: Int!
    kiosk: Int!
  }

  # === INPUTS ===

  input CreateParticipationInput {
    campaignId: String!
    name: String!
    email: String!
    phone: String!
    country: String
    selectedCards: [String!]!
    source: String
    ipAddress: String
    userAgent: String
  }

  # === QUERIES ===

  extend type Query {
    # Obtener campaña por slug
    campaign(slug: String!): Campaign
    
    # Listar campañas activas
    campaigns(country: String): [CampaignSummary!]!
    
    # Obtener participación por ID
    participation(id: String!): Participation
    
    # Obtener premio por código
    prizeByCode(code: String!): Participation
    
    # Calcular giros según tarjetas
    calculateSpins(campaignId: String!, selectedCards: [String!]!): Int!
    
    # Stats de campaña (admin)
    campaignStats(campaignId: String!): CampaignStats
  }

  # === MUTATIONS ===

  extend type Mutation {
    # Crear participación (registro)
    createParticipation(input: CreateParticipationInput!): Participation!
    
    # Girar la ruleta
    spin(participationId: String!): SpinResult!
    
    # Verificar premio (admin)
    verifyPrize(prizeCode: String!, verifiedBy: String): Participation
    
    # Entregar premio (admin)
    deliverPrize(prizeCode: String!): Participation
  }
`;


// ============================================
// RESOLVERS
// ============================================

export const promoResolvers = {
  Query: {
    campaign: async (_: unknown, { slug }: { slug: string }) => {
      try {
        const campaign = await promoService.getCampaignBySlug(slug);
        if (!campaign) return null;
        
        return {
          ...campaign,
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate.toISOString(),
        };
      } catch (error) {
        console.error('[Promo.graphql] campaign error:', error);
        return null;
      }
    },

    campaigns: async (_: unknown, { country }: { country?: string }) => {
      try {
        const campaigns = await promoService.listActiveCampaigns(country);
        return campaigns.map(c => ({
          ...c,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate.toISOString(),
        }));
      } catch (error) {
        console.error('[Promo.graphql] campaigns error:', error);
        return [];
      }
    },

    participation: async (_: unknown, { id }: { id: string }) => {
      try {
        const participation = await promoService.getParticipation(id);
        if (!participation) return null;
        
        return {
          ...participation,
          createdAt: participation.createdAt.toISOString(),
        };
      } catch (error) {
        console.error('[Promo.graphql] participation error:', error);
        return null;
      }
    },

    prizeByCode: async (_: unknown, { code }: { code: string }) => {
      try {
        const participation = await promoService.getPrizeByCode(code);
        if (!participation) return null;
        
        return {
          ...participation,
          createdAt: participation.createdAt.toISOString(),
        };
      } catch (error) {
        console.error('[Promo.graphql] prizeByCode error:', error);
        return null;
      }
    },

    calculateSpins: async (
      _: unknown, 
      { campaignId, selectedCards }: { campaignId: string; selectedCards: string[] }
    ) => {
      try {
        const parsed = CalculateSpinsSchema.parse({ campaignId, selectedCards });
        return promoService.calculateSpinsForCards(parsed);
      } catch (error) {
        console.error('[Promo.graphql] calculateSpins error:', error);
        return selectedCards.length;
      }
    },

    campaignStats: async (_: unknown, { campaignId }: { campaignId: string }) => {
      try {
        return promoService.getCampaignStats(campaignId);
      } catch (error) {
        console.error('[Promo.graphql] campaignStats error:', error);
        return null;
      }
    },
  },

  Mutation: {
    createParticipation: async (_: unknown, { input }: { input: any }) => {
      try {
        const parsed = CreateParticipationSchema.parse(input);
        const participation = await promoService.createParticipation(parsed);
        
        return {
          ...participation,
          createdAt: participation.createdAt.toISOString(),
        };
      } catch (error) {
        console.error('[Promo.graphql] createParticipation error:', error);
        throw error;
      }
    },

    spin: async (_: unknown, { participationId }: { participationId: string }) => {
      try {
        const parsed = SpinWheelSchema.parse({ participationId });
        return promoService.spin(parsed.participationId);
      } catch (error) {
        console.error('[Promo.graphql] spin error:', error);
        throw error;
      }
    },

    verifyPrize: async (
      _: unknown, 
      { prizeCode, verifiedBy }: { prizeCode: string; verifiedBy?: string }
    ) => {
      try {
        const parsed = VerifyPrizeSchema.parse({ prizeCode, verifiedBy });
        const participation = await promoService.verifyPrize(parsed.prizeCode, parsed.verifiedBy);
        if (!participation) return null;
        
        return {
          ...participation,
          createdAt: participation.createdAt.toISOString(),
        };
      } catch (error) {
        console.error('[Promo.graphql] verifyPrize error:', error);
        throw error;
      }
    },

    deliverPrize: async (_: unknown, { prizeCode }: { prizeCode: string }) => {
      try {
        const participation = await promoService.deliverPrize(prizeCode);
        if (!participation) return null;
        
        return {
          ...participation,
          createdAt: participation.createdAt.toISOString(),
        };
      } catch (error) {
        console.error('[Promo.graphql] deliverPrize error:', error);
        throw error;
      }
    },
  },
};
