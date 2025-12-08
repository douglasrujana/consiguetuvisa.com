// src/pages/api/leads/capture.ts
// API unificada para captura de leads desde cualquier formulario

import type { APIRoute } from 'astro';
import { buildContext } from '../../../server/lib/core/di/ContextFactory';
import { LeadCaptureSchema } from '../../../server/lib/features/leads';
import type { LeadFormConfig } from '../../../server/lib/features/leads';
import { ZodError } from 'zod';

/**
 * Configuraciones predefinidas de formularios.
 * Cada landing/página puede tener su propia configuración.
 */
const FORM_CONFIGS: Record<string, LeadFormConfig> = {
  // Formulario de contacto principal
  'contact-main': {
    formId: 'contact-main',
    source: 'WEB_CONTACT',
    sendEmailNotification: true,
    emailTemplate: 'default',
    syncToCRM: true,
    createDeal: false,
  },
  
  // Landing de Navidad
  'landing-navidad': {
    formId: 'landing-navidad',
    source: 'WEB_LANDING',
    campaign: 'navidad-2025',
    sendEmailNotification: true,
    emailTemplate: 'navidad',
    syncToCRM: true,
    createDeal: true,
    dealStage: 'appointmentscheduled',
  },
  
  // Landing de urgente
  'landing-urgente': {
    formId: 'landing-urgente',
    source: 'WEB_LANDING',
    campaign: 'urgente-24h',
    sendEmailNotification: true,
    emailTemplate: 'urgent',
    syncToCRM: true,
    createDeal: true,
    dealStage: 'qualifiedtobuy',
  },
  
  // Formulario genérico de landing
  'landing-generic': {
    formId: 'landing-generic',
    source: 'WEB_LANDING',
    sendEmailNotification: true,
    syncToCRM: true,
    createDeal: false,
  },
  
  // WhatsApp widget
  'whatsapp-widget': {
    formId: 'whatsapp-widget',
    source: 'WHATSAPP',
    sendEmailNotification: true,
    syncToCRM: true,
    createDeal: false,
  },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Obtener configuración del formulario
    const formId = body.formId || 'contact-main';
    const formConfig = FORM_CONFIGS[formId] || FORM_CONFIGS['contact-main'];
    
    // Sobrescribir con configuración custom si viene en el body
    const finalConfig: LeadFormConfig = {
      ...formConfig,
      ...(body.campaign && { campaign: body.campaign }),
      ...(body.source && { source: body.source }),
    };
    
    // Validar datos del lead
    const validatedData = LeadCaptureSchema.parse({
      email: body.email,
      name: body.name,
      phone: body.phone,
      city: body.city,
      visaType: body.visaType,
      destinationCountry: body.destinationCountry,
      message: body.message,
      source: finalConfig.source,
      campaign: finalConfig.campaign,
      landingPage: body.landingPage || request.headers.get('referer'),
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
    });

    // Metadata de la request
    const metadata = {
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Capturar lead
    const context = buildContext(request);
    const result = await context.leadService.captureLead(
      validatedData,
      finalConfig,
      metadata
    );

    // Respuesta
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: finalConfig.successMessage || '¡Gracias! Te contactaremos pronto.',
        leadId: result.leadId,
        redirectUrl: finalConfig.redirectUrl,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Éxito parcial (al menos email o CRM funcionó)
      return new Response(JSON.stringify({
        success: true,
        message: '¡Gracias! Te contactaremos pronto.',
        warnings: result.errors,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Datos inválidos',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error POST /api/leads/capture:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error procesando la solicitud',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
