// src/server/lib/features/leads/Lead.service.ts

/**
 * SERVICIO DE LEADS
 * Servicio unificado y reutilizable para captura de leads.
 * Orquesta: validación → email → CRM → persistencia
 */

import type { IEmailProvider, EmailMessage } from '../../adapters/email';
import type { ICRMProvider } from '../../adapters/crm';
import type { Lead, LeadCaptureResult } from './Lead.entity';
import type { LeadCaptureDTO, LeadFormConfig } from './Lead.dto';
import { config } from '../../core/config';

// Tipo para el log de operaciones
interface OperationLog {
  timestamp: Date;
  operation: string;
  success: boolean;
  details?: string;
  duration?: number;
}

export class LeadService {
  constructor(
    private readonly emailProvider: IEmailProvider,
    private readonly crmProvider: ICRMProvider,
  ) {}

  /**
   * Captura un lead desde cualquier formulario.
   * Proceso: Validar → Email → CRM → Respuesta
   */
  async captureLead(
    data: LeadCaptureDTO,
    formConfig: LeadFormConfig,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<LeadCaptureResult> {
    const errors: string[] = [];
    const logs: OperationLog[] = [];
    let emailSent = false;
    let crmSynced = false;
    let crmContactId: string | undefined;
    let crmLeadId: string | undefined;

    const startTime = Date.now();

    // Log inicial
    this.log('📥 LEAD CAPTURE START', {
      formId: formConfig.formId,
      email: data.email,
      name: data.name,
      source: formConfig.source,
      campaign: formConfig.campaign,
    });

    // 1. Construir el lead
    const lead: Lead = {
      ...data,
      source: formConfig.source,
      campaign: formConfig.campaign || data.campaign,
      status: 'NEW',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      createdAt: new Date(),
    };

    // 2. Enviar email de notificación
    if (formConfig.sendEmailNotification && config.features.emailNotifications) {
      const emailStart = Date.now();
      try {
        this.log('📧 Sending email notification...');
        const emailResult = await this.sendNotificationEmail(lead, formConfig);
        emailSent = emailResult.success;
        
        logs.push({
          timestamp: new Date(),
          operation: 'EMAIL_SEND',
          success: emailResult.success,
          details: emailResult.success 
            ? `Message ID: ${emailResult.messageId}` 
            : emailResult.error,
          duration: Date.now() - emailStart,
        });

        if (emailResult.success) {
          this.log('✅ Email sent successfully', { messageId: emailResult.messageId });
        } else {
          this.log('❌ Email failed', { error: emailResult.error });
          errors.push(`Email: ${emailResult.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        this.log('❌ Email exception', { error: errorMsg });
        errors.push(`Email: ${errorMsg}`);
        logs.push({
          timestamp: new Date(),
          operation: 'EMAIL_SEND',
          success: false,
          details: errorMsg,
          duration: Date.now() - emailStart,
        });
      }
    } else {
      this.log('⏭️ Email notification skipped', {
        sendEmailNotification: formConfig.sendEmailNotification,
        emailNotificationsEnabled: config.features.emailNotifications,
      });
    }

    // 3. Sincronizar con CRM
    if (formConfig.syncToCRM && config.features.crmSync) {
      const crmStart = Date.now();
      try {
        this.log('🔄 Syncing to CRM...');
        
        // Crear/actualizar contacto
        const contactResult = await this.crmProvider.upsertContact({
          email: lead.email,
          firstName: lead.name.split(' ')[0],
          lastName: lead.name.split(' ').slice(1).join(' ') || undefined,
          phone: lead.phone,
          properties: {
            city: lead.city || '',
            visa_type: lead.visaType || '',
            destination_country: lead.destinationCountry || '',
            lead_source: lead.source,
            campaign: lead.campaign || '',
          },
        });

        if (contactResult.success) {
          crmContactId = contactResult.id;
          crmSynced = true;
          this.log('✅ CRM contact created/updated', { contactId: crmContactId });

          // Crear lead en CRM
          const leadResult = await this.crmProvider.createLead({
            email: lead.email,
            name: lead.name,
            phone: lead.phone,
            source: lead.source,
            properties: {
              visa_type: lead.visaType || '',
              message: lead.message || '',
            },
          });

          if (leadResult.success) {
            crmLeadId = leadResult.id;
            this.log('✅ CRM lead created', { leadId: crmLeadId });
          }

          // Crear deal si está configurado
          if (formConfig.createDeal && crmContactId) {
            const dealResult = await this.crmProvider.createDeal({
              name: `${lead.name} - ${lead.visaType || 'Consulta'}`,
              contactId: crmContactId,
              stage: formConfig.dealStage || 'appointmentscheduled',
              properties: {
                visa_type: lead.visaType || '',
                destination: lead.destinationCountry || '',
              },
            });
            
            if (dealResult.success) {
              this.log('✅ CRM deal created', { dealId: dealResult.id });
            }
          }

          logs.push({
            timestamp: new Date(),
            operation: 'CRM_SYNC',
            success: true,
            details: `Contact: ${crmContactId}, Lead: ${crmLeadId || 'N/A'}`,
            duration: Date.now() - crmStart,
          });
        } else {
          this.log('❌ CRM sync failed', { error: contactResult.error });
          errors.push(`CRM: ${contactResult.error}`);
          logs.push({
            timestamp: new Date(),
            operation: 'CRM_SYNC',
            success: false,
            details: contactResult.error,
            duration: Date.now() - crmStart,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        this.log('❌ CRM exception', { error: errorMsg });
        errors.push(`CRM: ${errorMsg}`);
        logs.push({
          timestamp: new Date(),
          operation: 'CRM_SYNC',
          success: false,
          details: errorMsg,
          duration: Date.now() - crmStart,
        });
      }
    } else {
      this.log('⏭️ CRM sync skipped', {
        syncToCRM: formConfig.syncToCRM,
        crmSyncEnabled: config.features.crmSync,
      });
    }

    // 4. Log final
    const totalDuration = Date.now() - startTime;
    const success = errors.length === 0 || emailSent || crmSynced;
    
    this.log(`${success ? '✅' : '❌'} LEAD CAPTURE ${success ? 'COMPLETE' : 'FAILED'}`, {
      duration: `${totalDuration}ms`,
      emailSent,
      crmSynced,
      errors: errors.length > 0 ? errors : 'none',
    });

    // 5. Retornar resultado
    return {
      success,
      leadId: crmLeadId || crmContactId,
      emailSent,
      crmSynced,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Log helper con formato consistente
   */
  private log(message: string, data?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const prefix = `[LeadService ${timestamp}]`;
    
    if (data) {
      console.log(prefix, message, JSON.stringify(data, null, 2));
    } else {
      console.log(prefix, message);
    }
  }

  /**
   * Envía email de notificación al equipo.
   */
  private async sendNotificationEmail(lead: Lead, formConfig: LeadFormConfig) {
    const recipients = [
      config.app.supportEmail,
      ...(formConfig.notifyEmails || []),
    ].filter(Boolean);

    const subject = this.getEmailSubject(lead, formConfig);
    const html = this.buildEmailHtml(lead, formConfig);
    const text = this.buildEmailText(lead);

    const message: EmailMessage = {
      to: recipients,
      subject,
      html,
      text,
      replyTo: lead.email,
      tags: {
        source: lead.source,
        campaign: lead.campaign || 'none',
        form: formConfig.formId,
      },
    };

    return this.emailProvider.send(message);
  }

  private getEmailSubject(lead: Lead, formConfig: LeadFormConfig): string {
    const prefix = formConfig.campaign 
      ? `[${formConfig.campaign.toUpperCase()}]` 
      : '[NUEVO LEAD]';
    
    const visaInfo = lead.visaType 
      ? ` - ${lead.visaType}` 
      : '';

    return `${prefix} ${lead.name}${visaInfo}`;
  }

  private buildEmailHtml(lead: Lead, formConfig: LeadFormConfig): string {
    const campaignBadge = formConfig.campaign 
      ? `<span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">${formConfig.campaign}</span>` 
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2d5be3; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; margin-top: 4px; }
          .cta { display: inline-block; background: #25d366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          .footer { margin-top: 20px; font-size: 12px; color: #999; }
          .status { background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">🎯 Nuevo Lead ${campaignBadge}</h1>
            <p style="margin:10px 0 0;opacity:0.9;">Fuente: ${lead.source}</p>
          </div>
          <div class="content">
            <p><span class="status">✓ Datos recibidos correctamente</span></p>
            
            <div class="field">
              <div class="label">Nombre</div>
              <div class="value">${lead.name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${lead.email}">${lead.email}</a></div>
            </div>
            ${lead.phone ? `
            <div class="field">
              <div class="label">Teléfono</div>
              <div class="value"><a href="tel:${lead.phone}">${lead.phone}</a></div>
            </div>
            ` : ''}
            ${lead.city ? `
            <div class="field">
              <div class="label">Ciudad</div>
              <div class="value">${lead.city}</div>
            </div>
            ` : ''}
            ${lead.visaType ? `
            <div class="field">
              <div class="label">Tipo de Visa</div>
              <div class="value">${lead.visaType}</div>
            </div>
            ` : ''}
            ${lead.destinationCountry ? `
            <div class="field">
              <div class="label">País Destino</div>
              <div class="value">${lead.destinationCountry}</div>
            </div>
            ` : ''}
            ${lead.message ? `
            <div class="field">
              <div class="label">Mensaje</div>
              <div class="value">${lead.message}</div>
            </div>
            ` : ''}
            
            ${lead.phone ? `
            <a href="https://wa.me/${lead.phone.replace(/\D/g, '')}?text=Hola ${encodeURIComponent(lead.name)}, gracias por contactarnos..." class="cta">
              💬 Contactar por WhatsApp
            </a>
            ` : ''}
            
            <div class="footer">
              <p>📅 Recibido: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</p>
              ${lead.landingPage ? `<p>🔗 Página: ${lead.landingPage}</p>` : ''}
              ${lead.utmCampaign ? `<p>📊 UTM Campaign: ${lead.utmCampaign}</p>` : ''}
              <p>🆔 Form ID: ${formConfig.formId}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildEmailText(lead: Lead): string {
    return `
NUEVO LEAD - ${lead.source}
============================
✓ Datos recibidos correctamente

Nombre: ${lead.name}
Email: ${lead.email}
${lead.phone ? `Teléfono: ${lead.phone}` : ''}
${lead.city ? `Ciudad: ${lead.city}` : ''}
${lead.visaType ? `Tipo de Visa: ${lead.visaType}` : ''}
${lead.destinationCountry ? `País Destino: ${lead.destinationCountry}` : ''}
${lead.message ? `\nMensaje:\n${lead.message}` : ''}

---
Recibido: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
    `.trim();
  }
}
