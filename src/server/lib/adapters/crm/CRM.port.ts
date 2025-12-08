// src/server/lib/adapters/crm/CRM.port.ts

/**
 * PUERTO DE CRM
 * Contrato genérico para todos los proveedores de CRM.
 * Anti vendor-locking: HubSpot, Bitrix24, Salesforce, etc.
 */

export interface CRMContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  properties?: Record<string, string | number | boolean>;
}

export interface CRMLead {
  email: string;
  name: string;
  phone?: string;
  source?: string;
  properties?: Record<string, string | number | boolean>;
}

export interface CRMDeal {
  name: string;
  amount?: number;
  stage?: string;
  contactId?: string;
  properties?: Record<string, string | number | boolean>;
}

export interface CRMResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface ICRMProvider {
  /**
   * Crea o actualiza un contacto.
   */
  upsertContact(contact: CRMContact): Promise<CRMResult>;

  /**
   * Crea un lead/prospecto.
   */
  createLead(lead: CRMLead): Promise<CRMResult>;

  /**
   * Crea un deal/oportunidad.
   */
  createDeal(deal: CRMDeal): Promise<CRMResult>;

  /**
   * Actualiza el estado de un deal.
   */
  updateDealStage(dealId: string, stage: string): Promise<CRMResult>;

  /**
   * Verifica si el proveedor está configurado.
   */
  isConfigured(): boolean;
}
