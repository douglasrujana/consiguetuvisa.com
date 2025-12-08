// src/server/lib/adapters/crm/Bitrix24.adapter.ts

/**
 * ADAPTADOR DE BITRIX24
 * Implementación del puerto ICRMProvider para Bitrix24.
 * Si cambias a HubSpot, Salesforce, etc., solo creas otro adaptador.
 */

import type { ICRMProvider } from '../../features/solicitud/Solicitud.port';
import type { Solicitud } from '../../features/solicitud/Solicitud.entity';

interface BitrixConfig {
  webhookUrl: string; // URL del webhook de Bitrix24
  userId?: string;    // ID del usuario responsable por defecto
}

/**
 * Mapea el tipo de visa a la categoría de Bitrix.
 */
function mapVisaTypeToCategory(visaType: string): string {
  const categoryMap: Record<string, string> = {
    'USA_TURISMO': 'Visa USA',
    'CANADA_VISITANTE': 'Visa Canadá',
    'SCHENGEN': 'Visa Schengen',
    'UK': 'Visa UK',
    'MEXICO': 'Visa México',
    'OTRO': 'Otros',
  };
  return categoryMap[visaType] || 'Otros';
}

/**
 * Mapea el estado de solicitud al estado de Bitrix.
 */
function mapStatusToBitrix(status: string): string {
  const statusMap: Record<string, string> = {
    'NUEVA': 'NEW',
    'EN_REVISION': 'IN_PROCESS',
    'DOCUMENTOS': 'IN_PROCESS',
    'FORMULARIO': 'IN_PROCESS',
    'CITA_AGENDADA': 'PREPARATION',
    'ENTREVISTA': 'PREPARATION',
    'APROBADA': 'WON',
    'RECHAZADA': 'LOSE',
    'CANCELADA': 'LOSE',
  };
  return statusMap[status] || 'NEW';
}

export class Bitrix24Adapter implements ICRMProvider {
  private webhookUrl: string;
  private defaultUserId?: string;

  constructor(config: BitrixConfig) {
    this.webhookUrl = config.webhookUrl;
    this.defaultUserId = config.userId;
  }

  /**
   * Hace una llamada a la API de Bitrix24.
   */
  private async callBitrix(method: string, params: Record<string, any>): Promise<any> {
    const url = `${this.webhookUrl}/${method}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Bitrix24 API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Bitrix24 error: ${data.error_description || data.error}`);
    }

    return data.result;
  }

  async createLead(solicitud: Solicitud): Promise<{ leadId: string }> {
    const fields = {
      TITLE: `${solicitud.fullName} - ${mapVisaTypeToCategory(solicitud.visaType)}`,
      NAME: solicitud.fullName.split(' ')[0] || solicitud.fullName,
      LAST_NAME: solicitud.fullName.split(' ').slice(1).join(' ') || '',
      EMAIL: [{ VALUE: solicitud.email, VALUE_TYPE: 'WORK' }],
      PHONE: [{ VALUE: solicitud.phone, VALUE_TYPE: 'MOBILE' }],
      SOURCE_ID: this.mapSourceToBitrix(solicitud.source),
      STATUS_ID: 'NEW',
      COMMENTS: this.buildLeadComments(solicitud),
      ...(this.defaultUserId && { ASSIGNED_BY_ID: this.defaultUserId }),
      // Campos personalizados (UF_CRM_*)
      // UF_CRM_VISA_TYPE: solicitud.visaType,
      // UF_CRM_DESTINATION: solicitud.destinationCountry,
    };

    const result = await this.callBitrix('crm.lead.add', { fields });
    
    return { leadId: String(result) };
  }

  async updateLead(leadId: string, data: Partial<Solicitud>): Promise<boolean> {
    const fields: Record<string, any> = {};
    
    if (data.fullName) {
      fields.NAME = data.fullName.split(' ')[0];
      fields.LAST_NAME = data.fullName.split(' ').slice(1).join(' ');
    }
    if (data.email) fields.EMAIL = [{ VALUE: data.email, VALUE_TYPE: 'WORK' }];
    if (data.phone) fields.PHONE = [{ VALUE: data.phone, VALUE_TYPE: 'MOBILE' }];
    if (data.status) fields.STATUS_ID = mapStatusToBitrix(data.status);

    await this.callBitrix('crm.lead.update', { id: leadId, fields });
    return true;
  }

  async convertToDeal(leadId: string): Promise<{ dealId: string }> {
    // Bitrix24 convierte leads a deals automáticamente
    // Primero obtenemos el lead para ver si ya tiene deal
    const lead = await this.callBitrix('crm.lead.get', { id: leadId });
    
    if (lead.STATUS_ID === 'CONVERTED') {
      // Ya convertido, buscar el deal asociado
      const deals = await this.callBitrix('crm.deal.list', {
        filter: { LEAD_ID: leadId },
        select: ['ID'],
      });
      
      if (deals && deals.length > 0) {
        return { dealId: String(deals[0].ID) };
      }
    }

    // Convertir el lead
    const result = await this.callBitrix('crm.lead.productrows.set', {
      id: leadId,
      rows: [], // Sin productos por ahora
    });

    // Actualizar estado a convertido
    await this.callBitrix('crm.lead.update', {
      id: leadId,
      fields: { STATUS_ID: 'CONVERTED' },
    });

    // Crear deal manualmente si la conversión automática no funciona
    const dealResult = await this.callBitrix('crm.deal.add', {
      fields: {
        TITLE: lead.TITLE,
        LEAD_ID: leadId,
        CONTACT_ID: lead.CONTACT_ID,
        COMPANY_ID: lead.COMPANY_ID,
        STAGE_ID: 'NEW',
      },
    });

    return { dealId: String(dealResult) };
  }

  async updateDealStatus(dealId: string, status: string): Promise<boolean> {
    const stageId = this.mapStatusToStage(status);
    
    await this.callBitrix('crm.deal.update', {
      id: dealId,
      fields: { STAGE_ID: stageId },
    });
    
    return true;
  }

  async syncFromCRM(leadId: string): Promise<Partial<Solicitud> | null> {
    try {
      const lead = await this.callBitrix('crm.lead.get', { id: leadId });
      
      if (!lead) return null;

      return {
        fullName: `${lead.NAME || ''} ${lead.LAST_NAME || ''}`.trim(),
        email: lead.EMAIL?.[0]?.VALUE,
        phone: lead.PHONE?.[0]?.VALUE,
        // Mapear más campos según necesidad
      };
    } catch {
      return null;
    }
  }

  /**
   * Construye los comentarios del lead con la info de la solicitud.
   */
  private buildLeadComments(solicitud: Solicitud): string {
    const lines = [
      `Tipo de Visa: ${mapVisaTypeToCategory(solicitud.visaType)}`,
      `País destino: ${solicitud.destinationCountry}`,
      `Ciudad: ${solicitud.city || 'No especificada'}`,
    ];

    if (solicitud.travelDate) {
      lines.push(`Fecha de viaje: ${new Date(solicitud.travelDate).toLocaleDateString()}`);
    }
    if (solicitud.travelPurpose) {
      lines.push(`Propósito: ${solicitud.travelPurpose}`);
    }
    if (solicitud.hasVisaHistory) {
      lines.push(`Historial de visas: Sí - ${solicitud.visaHistoryNotes || ''}`);
    }
    if (solicitud.hasDenials) {
      lines.push(`Rechazos previos: Sí - ${solicitud.denialNotes || ''}`);
    }
    if (solicitud.source) {
      lines.push(`Fuente: ${solicitud.source}`);
    }

    return lines.join('\n');
  }

  /**
   * Mapea la fuente de la solicitud al source de Bitrix.
   */
  private mapSourceToBitrix(source?: string | null): string {
    const sourceMap: Record<string, string> = {
      'WEB': 'WEB',
      'WHATSAPP': 'OTHER',
      'REFERIDO': 'RECOMMENDATION',
      'LANDING_NAVIDAD': 'ADVERTISING',
    };
    return sourceMap[source || ''] || 'WEB';
  }

  /**
   * Mapea el estado de solicitud al stage de deal en Bitrix.
   */
  private mapStatusToStage(status: string): string {
    const stageMap: Record<string, string> = {
      'NUEVA': 'NEW',
      'EN_REVISION': 'PREPARATION',
      'DOCUMENTOS': 'PREPARATION',
      'FORMULARIO': 'PREPAYMENT_INVOICE',
      'CITA_AGENDADA': 'EXECUTING',
      'ENTREVISTA': 'EXECUTING',
      'APROBADA': 'WON',
      'RECHAZADA': 'LOSE',
      'CANCELADA': 'LOSE',
    };
    return stageMap[status] || 'NEW';
  }
}
