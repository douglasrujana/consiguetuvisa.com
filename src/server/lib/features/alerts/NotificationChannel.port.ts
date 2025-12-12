// src/server/lib/features/alerts/NotificationChannel.port.ts

/**
 * PUERTO NOTIFICATION CHANNEL - Contrato para canales de notificación
 * Anti vendor-locking: Email, Slack, SMS, Push, etc.
 * 
 * @requirements 12.1 - Notificación por múltiples canales
 */

import type { Alert, NotificationResult } from './Alert.entity';

/**
 * Configuración de canal de notificación
 */
export interface NotificationChannelConfig {
  enabled: boolean;
  recipients?: string[];
  webhookUrl?: string;
  apiKey?: string;
}

/**
 * Opciones de notificación
 */
export interface NotificationOptions {
  /** Forzar envío incluso si el canal está deshabilitado */
  force?: boolean;
  /** Destinatarios adicionales */
  additionalRecipients?: string[];
  /** Metadatos adicionales */
  metadata?: Record<string, unknown>;
}

/**
 * Interface para canales de notificación
 */
export interface INotificationChannel {
  /**
   * Nombre del canal (email, slack, sms, etc.)
   */
  readonly name: string;

  /**
   * Envía una notificación de alerta
   */
  notify(alert: Alert, options?: NotificationOptions): Promise<NotificationResult>;

  /**
   * Verifica si el canal está configurado correctamente
   */
  isConfigured(): boolean;

  /**
   * Verifica si el canal está habilitado
   */
  isEnabled(): boolean;
}

/**
 * Interface para el servicio de notificaciones multi-canal
 */
export interface INotificationService {
  /**
   * Registra un canal de notificación
   */
  registerChannel(channel: INotificationChannel): void;

  /**
   * Envía notificación por todos los canales habilitados
   */
  notifyAll(alert: Alert, options?: NotificationOptions): Promise<NotificationResult[]>;

  /**
   * Envía notificación por un canal específico
   */
  notifyChannel(channelName: string, alert: Alert, options?: NotificationOptions): Promise<NotificationResult>;

  /**
   * Obtiene los canales disponibles
   */
  getAvailableChannels(): string[];
}
