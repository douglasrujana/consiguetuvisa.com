// src/server/lib/features/leads/Lead.entity.ts

/**
 * ENTIDADES DE DOMINIO - LEADS
 * Modelo unificado para captura de leads desde cualquier fuente.
 */

export type LeadSource = 
  | 'WEB_CONTACT'      // Formulario de contacto principal
  | 'WEB_LANDING'      // Landing pages
  | 'WHATSAPP'         // WhatsApp directo
  | 'REFERRAL'         // Referidos
  | 'SOCIAL'           // Redes sociales
  | 'CAMPAIGN'         // Campañas específicas
  | 'OTHER';

export type LeadStatus = 
  | 'NEW'              // Recién capturado
  | 'CONTACTED'        // Ya se contactó
  | 'QUALIFIED'        // Calificado como prospecto
  | 'CONVERTED'        // Convertido a cliente
  | 'LOST';            // Perdido

export interface Lead {
  id?: string;
  
  // Datos de contacto
  email: string;
  name: string;
  phone?: string;
  city?: string;
  
  // Interés
  visaType?: string;
  destinationCountry?: string;
  message?: string;
  
  // Tracking
  source: LeadSource;
  campaign?: string;        // Nombre de campaña (ej: "navidad-2025")
  landingPage?: string;     // URL de la landing
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  // Estado
  status: LeadStatus;
  
  // IDs externos
  crmContactId?: string;
  crmLeadId?: string;
  crmDealId?: string;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

/**
 * Resultado de captura de lead.
 */
export interface LeadCaptureResult {
  success: boolean;
  leadId?: string;
  emailSent: boolean;
  crmSynced: boolean;
  errors?: string[];
}
