// src/server/lib/features/promo/Promo.dto.ts

/**
 * DTOs Y VALIDACIÓN CON ZOD
 * Schemas para validar entrada de datos.
 */

import { z } from 'zod';

// ============================================
// CAMPAIGN QUERIES
// ============================================

export const GetCampaignBySlugSchema = z.object({
  slug: z.string().min(1).max(100),
});

export const ListCampaignsSchema = z.object({
  country: z.string().length(2).optional(),
  activeOnly: z.boolean().default(true),
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0),
});

// ============================================
// PARTICIPATION
// ============================================

export const CreateParticipationSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20), // WhatsApp
  country: z.string().length(2).default('EC'),
  selectedCards: z.array(z.string()).min(1).max(20),
  source: z.enum(['WEB', 'KIOSK']).default('WEB'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const SpinWheelSchema = z.object({
  participationId: z.string().uuid(),
});

export const VerifyPrizeSchema = z.object({
  prizeCode: z.string().min(1),
  verifiedBy: z.string().optional(),
});

export const DeliverPrizeSchema = z.object({
  prizeCode: z.string().min(1),
});

// ============================================
// CARD SELECTION
// ============================================

export const CalculateSpinsSchema = z.object({
  campaignId: z.string().min(1),
  selectedCards: z.array(z.string()).min(1),
});

// ============================================
// TYPES INFERIDOS
// ============================================

export type GetCampaignBySlugDTO = z.infer<typeof GetCampaignBySlugSchema>;
export type ListCampaignsDTO = z.infer<typeof ListCampaignsSchema>;
export type CreateParticipationDTO = z.infer<typeof CreateParticipationSchema>;
export type SpinWheelDTO = z.infer<typeof SpinWheelSchema>;
export type VerifyPrizeDTO = z.infer<typeof VerifyPrizeSchema>;
export type DeliverPrizeDTO = z.infer<typeof DeliverPrizeSchema>;
export type CalculateSpinsDTO = z.infer<typeof CalculateSpinsSchema>;
