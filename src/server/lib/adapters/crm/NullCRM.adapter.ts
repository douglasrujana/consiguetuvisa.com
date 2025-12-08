// src/server/lib/adapters/crm/NullCRM.adapter.ts

/**
 * ADAPTADOR NULO
 * Para cuando no hay CRM configurado. Solo loguea las operaciones.
 */

import type { ICRMProvider, CRMContact, CRMLead, CRMDeal, CRMResult } from './CRM.port';

export class NullCRMAdapter implements ICRMProvider {
  isConfigured(): boolean {
    return true; // Siempre "disponible"
  }

  async upsertContact(contact: CRMContact): Promise<CRMResult> {
    console.log('[CRM:Null] upsertContact:', contact.email);
    return { success: true, id: `null-contact-${Date.now()}` };
  }

  async createLead(lead: CRMLead): Promise<CRMResult> {
    console.log('[CRM:Null] createLead:', lead.email, lead.name);
    return { success: true, id: `null-lead-${Date.now()}` };
  }

  async createDeal(deal: CRMDeal): Promise<CRMResult> {
    console.log('[CRM:Null] createDeal:', deal.name);
    return { success: true, id: `null-deal-${Date.now()}` };
  }

  async updateDealStage(dealId: string, stage: string): Promise<CRMResult> {
    console.log('[CRM:Null] updateDealStage:', dealId, stage);
    return { success: true, id: dealId };
  }
}
