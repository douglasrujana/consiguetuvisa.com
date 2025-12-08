// src/server/lib/features/leads/Lead.dto.ts

import { z } from 'zod';

/**
 * DTO para captura de leads desde formularios.
 * Validación con Zod.
 */
export const LeadCaptureSchema = z.object({
  // Requeridos
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  
  // Opcionales
  phone: z.string().optional(),
  city: z.string().optional(),
  
  // Interés
  visaType: z.string().optional(),
  destinationCountry: z.string().optional(),
  message: z.string().max(1000).optional(),
  
  // Tracking (se llenan automáticamente)
  source: z.enum([
    'WEB_CONTACT', 'WEB_LANDING', 'WHATSAPP', 
    'REFERRAL', 'SOCIAL', 'CAMPAIGN', 'OTHER'
  ]).default('WEB_CONTACT'),
  campaign: z.string().optional(),
  landingPage: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type LeadCaptureDTO = z.infer<typeof LeadCaptureSchema>;

/**
 * Configuración del formulario de captura.
 * Permite personalizar el comportamiento por página.
 */
export interface LeadFormConfig {
  // Identificación
  formId: string;
  source: LeadCaptureDTO['source'];
  campaign?: string;
  
  // Email
  sendEmailNotification: boolean;
  emailTemplate?: 'default' | 'landing' | 'urgent' | 'navidad';
  notifyEmails?: string[];  // Emails adicionales a notificar
  
  // CRM
  syncToCRM: boolean;
  createDeal?: boolean;
  dealPipeline?: string;
  dealStage?: string;
  
  // Respuesta
  successMessage?: string;
  redirectUrl?: string;
}
