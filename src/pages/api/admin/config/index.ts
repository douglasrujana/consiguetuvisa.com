// GET/PUT /api/admin/config
// Configuración del sistema (solo lectura de estado, no expone secrets)

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';

// Valores por defecto para configuraciones editables
const DEFAULTS = {
  // AI Generation
  'ai.temperature': '0.7',
  'ai.topP': '0.95',
  'ai.topK': '40',
  'ai.maxTokens': '2048',
  'ai.timeout': '30000',
  'ai.streaming': 'true',
  
  // AI Quota & Availability
  'ai.quotaEnabled': 'false',
  'ai.dailyLimit': '1000',
  'ai.quotaExceededMessage': 'Hemos alcanzado el límite de consultas por hoy. Por favor, intenta mañana o contáctanos por WhatsApp.',
  'ai.availabilityMode': '24/7', // '24/7' | 'schedule'
  'ai.schedule': JSON.stringify({
    monday: { enabled: true, start: '08:00', end: '20:00' },
    tuesday: { enabled: true, start: '08:00', end: '20:00' },
    wednesday: { enabled: true, start: '08:00', end: '20:00' },
    thursday: { enabled: true, start: '08:00', end: '20:00' },
    friday: { enabled: true, start: '08:00', end: '20:00' },
    saturday: { enabled: true, start: '09:00', end: '14:00' },
    sunday: { enabled: false, start: '00:00', end: '00:00' },
  }),
  'ai.timezone': 'America/Guayaquil',
  'ai.unavailableMessage': 'Nuestro asistente está disponible de lunes a viernes de 8:00 a 20:00. Por favor, déjanos tu consulta y te responderemos pronto.',
  
  // Chat
  'chat.welcomeMessage': '¡Hola! Soy el asistente virtual de ConsigueTuVisa. ¿En qué puedo ayudarte?',
  'chat.systemPrompt': '',
  
  // RAG
  'rag.topK': '5',
  'rag.threshold': '0.7',
  
  // Alerts
  'alert.emailTo': '',
  
  // Banners (JSON array)
  'banners': '[]',
};

// Tipos de banners disponibles
export type BannerType = 'maintenance' | 'environment' | 'promotion' | 'warning' | 'announcement' | 'scheduled';

export interface Banner {
  id: string;
  type: BannerType;
  message: string;
  link?: string;
  linkText?: string;
  dismissible: boolean;
  startDate?: string;
  endDate?: string;
  targetPages: string[]; // ['*'] para todas, ['/chat', '/servicios'] para específicas
  targetRoles: string[]; // ['*'] para todos, ['USER', 'ADMIN'] para específicos
  bgColor?: string;
  textColor?: string;
  enabled: boolean;
}

// Configuraciones que se pueden leer (sin exponer secrets)
function getPublicConfig() {
  return {
    // General
    appUrl: import.meta.env.PUBLIC_APP_URL || 'http://localhost:3000',
    supportEmail: import.meta.env.SUPPORT_EMAIL || '',
    whatsappNumber: import.meta.env.WHATSAPP_NUMBER || '',
    
    // AI
    aiProvider: import.meta.env.GEMINI_API_KEY ? 'gemini' : 'none',
    aiModel: 'gemini-2.5-flash-lite',
    
    // Storage
    storageProvider: import.meta.env.STORAGE_PROVIDER || 'local',
    
    // Chat
    chatStorageMode: import.meta.env.CHAT_STORAGE_MODE || 'smart',
    
    // Integraciones (solo estado, no keys)
    integrations: {
      clerk: !!import.meta.env.CLERK_SECRET_KEY,
      resend: !!import.meta.env.RESEND_API_KEY,
      hubspot: !!import.meta.env.HUBSPOT_API_KEY,
      sanity: !!import.meta.env.SANITY_API_TOKEN,
      gemini: !!import.meta.env.GEMINI_API_KEY,
      turso: !!import.meta.env.TURSO_AUTH_TOKEN,
      vercelBlob: !!import.meta.env.BLOB_READ_WRITE_TOKEN,
    }
  };
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { localUser } = locals as any;
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener configuraciones de BD (si existen)
    const dbSettings = await prisma.systemConfig.findMany();
    const settingsMap = Object.fromEntries(dbSettings.map(s => [s.key, s.value]));

    // Helper para obtener valor con default
    const get = (key: string) => settingsMap[key] ?? DEFAULTS[key as keyof typeof DEFAULTS] ?? '';

    // Combinar con env vars
    const config = {
      ...getPublicConfig(),
      
      // AI Generation Parameters
      aiTemperature: parseFloat(get('ai.temperature')),
      aiTopP: parseFloat(get('ai.topP')),
      aiTopK: parseInt(get('ai.topK')),
      aiMaxTokens: parseInt(get('ai.maxTokens')),
      aiTimeout: parseInt(get('ai.timeout')),
      aiStreaming: get('ai.streaming') === 'true',
      
      // AI Quota & Availability
      aiQuotaEnabled: get('ai.quotaEnabled') === 'true',
      aiDailyLimit: parseInt(get('ai.dailyLimit')),
      aiQuotaExceededMessage: get('ai.quotaExceededMessage'),
      aiAvailabilityMode: get('ai.availabilityMode'),
      aiSchedule: JSON.parse(get('ai.schedule')),
      aiTimezone: get('ai.timezone'),
      aiUnavailableMessage: get('ai.unavailableMessage'),
      
      // Chat
      chatWelcomeMessage: get('chat.welcomeMessage'),
      chatSystemPrompt: get('chat.systemPrompt'),
      
      // RAG
      ragTopK: parseInt(get('rag.topK')),
      ragThreshold: parseFloat(get('rag.threshold')),
      
      // Alerts
      alertEmailTo: get('alert.emailTo') || import.meta.env.ALERT_EMAIL_TO || '',
      
      // Banners
      banners: JSON.parse(get('banners')),
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error GET /api/admin/config:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const { localUser } = locals as any;
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const allowedKeys = [
      // AI Generation
      'ai.temperature',
      'ai.topP',
      'ai.topK',
      'ai.maxTokens',
      'ai.timeout',
      'ai.streaming',
      // AI Quota & Availability
      'ai.quotaEnabled',
      'ai.dailyLimit',
      'ai.quotaExceededMessage',
      'ai.availabilityMode',
      'ai.schedule',
      'ai.timezone',
      'ai.unavailableMessage',
      // Chat
      'chat.welcomeMessage',
      'chat.systemPrompt', 
      // RAG
      'rag.topK',
      'rag.threshold',
      // Alerts
      'alert.emailTo',
      // Banners
      'banners',
    ];

    // Guardar solo las keys permitidas
    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await prisma.systemConfig.upsert({
          where: { key },
          update: { value: stringValue },
          create: { key, value: stringValue }
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error PUT /api/admin/config:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};

// ============================================
// API para verificar disponibilidad del chat (público)
// ============================================

export async function checkChatAvailability(): Promise<{
  available: boolean;
  reason?: string;
  message?: string;
}> {
  try {
    const dbSettings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'ai.quotaEnabled',
            'ai.dailyLimit',
            'ai.quotaExceededMessage',
            'ai.availabilityMode',
            'ai.schedule',
            'ai.timezone',
            'ai.unavailableMessage',
          ],
        },
      },
    });
    const settings = Object.fromEntries(dbSettings.map(s => [s.key, s.value]));
    
    const get = (key: string) => settings[key] ?? DEFAULTS[key as keyof typeof DEFAULTS] ?? '';
    
    // 1. Verificar cuota diaria
    const quotaEnabled = get('ai.quotaEnabled') === 'true';
    if (quotaEnabled) {
      const dailyLimit = parseInt(get('ai.dailyLimit'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = await prisma.chatMessage.count({
        where: {
          role: 'user',
          createdAt: { gte: today },
        },
      });
      
      if (todayCount >= dailyLimit) {
        return {
          available: false,
          reason: 'quota_exceeded',
          message: get('ai.quotaExceededMessage'),
        };
      }
    }
    
    // 2. Verificar horario de disponibilidad
    const availabilityMode = get('ai.availabilityMode');
    if (availabilityMode === 'schedule') {
      const schedule = JSON.parse(get('ai.schedule'));
      const timezone = get('ai.timezone');
      
      // Obtener hora actual en la zona horaria configurada
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      const currentTime = hour * 60 + minute; // minutos desde medianoche
      
      const daySchedule = schedule[weekday];
      if (!daySchedule?.enabled) {
        return {
          available: false,
          reason: 'outside_schedule',
          message: get('ai.unavailableMessage'),
        };
      }
      
      const [startH, startM] = daySchedule.start.split(':').map(Number);
      const [endH, endM] = daySchedule.end.split(':').map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;
      
      if (currentTime < startTime || currentTime > endTime) {
        return {
          available: false,
          reason: 'outside_schedule',
          message: get('ai.unavailableMessage'),
        };
      }
    }
    
    return { available: true };
  } catch (error) {
    console.error('Error checking chat availability:', error);
    // En caso de error, permitir el acceso
    return { available: true };
  }
}
