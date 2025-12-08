// src/server/lib/adapters/crm/HubSpot.adapter.ts

/**
 * ADAPTADOR DE HUBSPOT
 * Implementación del puerto ICRMProvider usando HubSpot API.
 */

import type { ICRMProvider, CRMContact, CRMLead, CRMDeal, CRMResult } from './CRM.port';
import { config } from '../../core/config';

export class HubSpotAdapter implements ICRMProvider {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = config.crm.apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request(endpoint: string, method: string, body?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('HubSpot API key no configurada');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HubSpot API error: ${response.status}`);
    }

    return response.json();
  }

  async upsertContact(contact: CRMContact): Promise<CRMResult> {
    try {
      // Primero buscar si existe
      const searchResult = await this.request(
        '/crm/v3/objects/contacts/search',
        'POST',
        {
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: contact.email,
            }],
          }],
        }
      );

      const properties: Record<string, string> = {
        email: contact.email,
      };
      if (contact.firstName) properties.firstname = contact.firstName;
      if (contact.lastName) properties.lastname = contact.lastName;
      if (contact.phone) properties.phone = contact.phone;
      if (contact.company) properties.company = contact.company;
      
      // Agregar propiedades adicionales
      if (contact.properties) {
        Object.entries(contact.properties).forEach(([key, value]) => {
          properties[key] = String(value);
        });
      }

      let result;
      if (searchResult.total > 0) {
        // Actualizar existente
        const contactId = searchResult.results[0].id;
        result = await this.request(
          `/crm/v3/objects/contacts/${contactId}`,
          'PATCH',
          { properties }
        );
      } else {
        // Crear nuevo
        result = await this.request(
          '/crm/v3/objects/contacts',
          'POST',
          { properties }
        );
      }

      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async createLead(lead: CRMLead): Promise<CRMResult> {
    // En HubSpot, los leads son contactos con lifecycle stage = lead
    return this.upsertContact({
      email: lead.email,
      firstName: lead.name.split(' ')[0],
      lastName: lead.name.split(' ').slice(1).join(' '),
      phone: lead.phone,
      properties: {
        lifecyclestage: 'lead',
        hs_lead_status: 'NEW',
        ...(lead.source && { leadsource: lead.source }),
        ...lead.properties,
      },
    });
  }

  async createDeal(deal: CRMDeal): Promise<CRMResult> {
    try {
      const properties: Record<string, string | number> = {
        dealname: deal.name,
        pipeline: 'default',
        dealstage: deal.stage || 'appointmentscheduled',
      };
      
      if (deal.amount) properties.amount = deal.amount;
      
      if (deal.properties) {
        Object.entries(deal.properties).forEach(([key, value]) => {
          properties[key] = typeof value === 'boolean' ? String(value) : value;
        });
      }

      const result = await this.request(
        '/crm/v3/objects/deals',
        'POST',
        { properties }
      );

      // Asociar con contacto si existe
      if (deal.contactId) {
        await this.request(
          `/crm/v3/objects/deals/${result.id}/associations/contacts/${deal.contactId}/deal_to_contact`,
          'PUT'
        );
      }

      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async updateDealStage(dealId: string, stage: string): Promise<CRMResult> {
    try {
      await this.request(
        `/crm/v3/objects/deals/${dealId}`,
        'PATCH',
        {
          properties: {
            dealstage: stage,
          },
        }
      );

      return { success: true, id: dealId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
