// src/server/lib/core/config/config.ts

/**
 * SISTEMA DE CONFIGURACIÓN POR ENTORNOS
 * Patrón moderno y escalable para manejar configuraciones.
 * Soporta: development, testing, staging, production
 */

export type Environment = 'development' | 'testing' | 'staging' | 'production';

// ============================================
// INTERFACES DE CONFIGURACIÓN
// ============================================

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'ses' | 'console';
  apiKey?: string;
  from: string;
  replyTo?: string;
  enabled: boolean;
}

export interface CRMConfig {
  provider: 'hubspot' | 'bitrix24' | 'salesforce' | 'none';
  apiKey?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'none';
  apiKey?: string;
  model: string;
  enabled: boolean;
}

export interface DatabaseConfig {
  provider: 'sqlite' | 'postgresql' | 'mysql';
  url: string;
}

export interface AppConfig {
  env: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isTesting: boolean;
  
  app: {
    name: string;
    url: string;
    supportEmail: string;
    whatsappNumber: string;
  };
  
  email: EmailConfig;
  crm: CRMConfig;
  ai: AIConfig;
  database: DatabaseConfig;
  
  features: {
    emailNotifications: boolean;
    crmSync: boolean;
    aiAssistant: boolean;
  };
}

// ============================================
// CONFIGURACIÓN POR ENTORNO
// ============================================

function getEnvironment(): Environment {
  const env = process.env.NODE_ENV || 
              (typeof import.meta !== 'undefined' ? import.meta.env?.MODE : undefined) || 
              'development';
  
  if (env === 'test' || env === 'testing') return 'testing';
  if (env === 'staging') return 'staging';
  if (env === 'production' || env === 'prod') return 'production';
  return 'development';
}

// Helper para obtener variables de entorno de forma segura
function getEnv(key: string, defaultValue = ''): string {
  // Primero intentar process.env (Node.js)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  // Luego intentar import.meta.env (Vite/Astro)
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
}

function loadConfig(): AppConfig {
  const env = getEnvironment();
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  const isTesting = env === 'testing';

  // Configuración base
  const baseConfig: AppConfig = {
    env,
    isProduction,
    isDevelopment,
    isTesting,
    
    app: {
      name: 'ConsigueTuVisa',
      url: getEnv('PUBLIC_APP_URL', 'http://localhost:3000'),
      supportEmail: getEnv('SUPPORT_EMAIL', 'info@consiguetuvisa.com'),
      whatsappNumber: getEnv('WHATSAPP_NUMBER', '+593999999999'),
    },
    
    email: {
      provider: 'console', // Default: solo log en consola
      apiKey: getEnv('RESEND_API_KEY'),
      from: getEnv('EMAIL_FROM', 'ConsigueTuVisa <noreply@consiguetuvisa.com>'),
      replyTo: getEnv('EMAIL_REPLY_TO', 'info@consiguetuvisa.com'),
      enabled: false,
    },
    
    crm: {
      provider: 'none',
      apiKey: getEnv('HUBSPOT_API_KEY'),
      webhookUrl: getEnv('BITRIX24_WEBHOOK_URL'),
      enabled: false,
    },
    
    ai: {
      provider: 'none',
      apiKey: getEnv('OPENAI_API_KEY'),
      model: 'gpt-4o-mini',
      enabled: false,
    },
    
    database: {
      provider: 'sqlite',
      url: getEnv('DATABASE_URL', 'file:./dev.db'),
    },
    
    features: {
      emailNotifications: false,
      crmSync: false,
      aiAssistant: false,
    },
  };

  // Sobrescribir según entorno
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        email: {
          ...baseConfig.email,
          provider: baseConfig.email.apiKey ? 'resend' : 'console',
          enabled: true, // Siempre habilitado en dev (usa console si no hay API key)
        },
        crm: {
          ...baseConfig.crm,
          provider: baseConfig.crm.apiKey ? 'hubspot' : 
                   baseConfig.crm.webhookUrl ? 'bitrix24' : 'none',
          enabled: !!(baseConfig.crm.apiKey || baseConfig.crm.webhookUrl),
        },
        features: {
          emailNotifications: true,
          crmSync: !!(baseConfig.crm.apiKey || baseConfig.crm.webhookUrl),
          aiAssistant: !!baseConfig.ai.apiKey,
        },
      };

    case 'testing':
      return {
        ...baseConfig,
        email: {
          ...baseConfig.email,
          provider: 'console', // Siempre console en testing
          enabled: true,
        },
        crm: {
          ...baseConfig.crm,
          provider: 'none', // Deshabilitado en testing
          enabled: false,
        },
        features: {
          emailNotifications: true,
          crmSync: false,
          aiAssistant: false,
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        email: {
          ...baseConfig.email,
          provider: baseConfig.email.apiKey ? 'resend' : 'console',
          enabled: true,
        },
        crm: {
          ...baseConfig.crm,
          provider: baseConfig.crm.apiKey ? 'hubspot' : 'none',
          enabled: !!baseConfig.crm.apiKey,
        },
        features: {
          emailNotifications: true,
          crmSync: !!baseConfig.crm.apiKey,
          aiAssistant: false,
        },
      };

    case 'production':
      return {
        ...baseConfig,
        email: {
          ...baseConfig.email,
          provider: 'resend',
          enabled: !!baseConfig.email.apiKey,
        },
        crm: {
          ...baseConfig.crm,
          provider: baseConfig.crm.apiKey ? 'hubspot' : 
                   baseConfig.crm.webhookUrl ? 'bitrix24' : 'none',
          enabled: !!(baseConfig.crm.apiKey || baseConfig.crm.webhookUrl),
        },
        ai: {
          ...baseConfig.ai,
          provider: baseConfig.ai.apiKey ? 'openai' : 'none',
          enabled: !!baseConfig.ai.apiKey,
        },
        features: {
          emailNotifications: !!baseConfig.email.apiKey,
          crmSync: !!(baseConfig.crm.apiKey || baseConfig.crm.webhookUrl),
          aiAssistant: !!baseConfig.ai.apiKey,
        },
      };

    default:
      return baseConfig;
  }
}

// Singleton de configuración
let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

// Export directo para conveniencia
export const config = getConfig();
