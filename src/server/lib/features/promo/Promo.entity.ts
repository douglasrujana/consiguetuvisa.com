// src/server/lib/features/promo/Promo.entity.ts

/**
 * ENTIDADES DEL DOMINIO PROMO
 * Tipos puros del negocio, sin dependencias externas.
 */

// ============================================
// CAMPAIGN
// ============================================

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description?: string;
  country: string;
  startDate: Date;
  endDate: Date;
  maxParticipationsPerEmail: number;
  prizes: Prize[];
  cardBrands: CardBrand[];
  agencyInfo: AgencyInfo;
  termsAndConditions?: any[]; // Portable Text
  privacyPolicy?: any[];
  theme?: CampaignTheme;
  isActive: boolean;
}

export interface CampaignSummary {
  id: string;
  name: string;
  slug: string;
  country: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// ============================================
// PRIZE
// ============================================

export interface Prize {
  id: string;
  name: string;
  description?: string;
  type: PrizeType;
  value?: number;
  image?: SanityImage;
  color?: string;
  probability: number;
  inventory: number;
  expirationDays: number;
}

export type PrizeType = 
  | 'travel' 
  | 'giftcard' 
  | 'service' 
  | 'discount' 
  | 'dinner' 
  | 'flight' 
  | 'retry';

// ============================================
// CARD BRAND
// ============================================

export interface CardBrand {
  id: string;
  name: string;
  slug: string;
  logo: SanityImage;
  variants: CardVariant[];
  countries: string[];
  spinsPerCard: number;
  order: number;
}

export interface CardVariant {
  name: string;
  tier: CardTier;
  logo?: SanityImage;
  spinsBonus: number;
}

export type CardTier = 
  | 'classic' 
  | 'gold' 
  | 'platinum' 
  | 'black' 
  | 'signature' 
  | 'infinite' 
  | 'world';

// ============================================
// AGENCY INFO
// ============================================

export interface AgencyInfo {
  name?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  ruc?: string;
  website?: string;
  logo?: SanityImage;
  photo?: SanityImage;
}

// ============================================
// THEME
// ============================================

export interface CampaignTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundImage?: SanityImage;
}

// ============================================
// PARTICIPATION
// ============================================

export interface Participation {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  selectedCards: string[]; // slugs de las tarjetas
  totalSpins: number;
  spinsUsed: number;
  prizeId?: string;
  prizeName?: string;
  prizeCode?: string;
  prizeStatus: ParticipationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  deliveredAt?: Date;
  crmLeadId?: string;
  ipAddress?: string;
  userAgent?: string;
  source: ParticipationSource;
  createdAt: Date;
  updatedAt: Date;
}

export type ParticipationStatus = 
  | 'PENDING' 
  | 'VERIFIED' 
  | 'DELIVERED' 
  | 'EXPIRED';

export type ParticipationSource = 'WEB' | 'KIOSK';

// ============================================
// SPIN RESULT
// ============================================

export interface SpinResult {
  success: boolean;
  prize?: Prize;
  prizeCode?: string;
  spinsRemaining: number;
  message: string;
}

// ============================================
// SANITY IMAGE (helper)
// ============================================

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}
