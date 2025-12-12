// src/server/lib/features/alerts/Alert.service.ts

/**
 * SERVICIO DE ALERTAS
 * Orquesta la creación de alertas y notificaciones por múltiples canales.
 * 
 * @requirements 12.1 - Crear alertas desde menciones
 * @requirements 12.2 - Notificar por canales configurados
 * @requirements 12.4 - Incluir contexto en alertas
 */

import type { IAlertRepository } from './Alert.port';
import type { INotificationChannel, INotificationService, NotificationOptions } from './NotificationChannel.port';
import type { SocialMention } from '../social/SocialMention.entity';
import {
  Alert,
  AlertType,
  AlertPriority,
  CreateAlertInput,
  NotificationResult,
  AlertFilters,
} from './Alert.entity';
import { SentimentType } from '../social/SocialMention.entity';

export class AlertService implements INotificationService {
  private channels: Map<string, INotificationChannel> = new Map();

  constructor(private alertRepository: IAlertRepository) {}

  /**
   * Registra un canal de notificación
   */
  registerChannel(channel: INotificationChannel): void {
    this.channels.set(channel.name, channel);
  }

  /**
   * Obtiene los canales disponibles
   */
  getAvailableChannels(): string[] {
    return Array.from(this.channels.keys()).filter((name) => {
      const channel = this.channels.get(name);
      return channel?.isEnabled();
    });
  }

  /**
   * Crea una alerta y opcionalmente notifica
   */
  async createAlert(
    input: CreateAlertInput,
    notify = true,
    notifyOptions?: NotificationOptions
  ): Promise<{ alert: Alert; notifications: NotificationResult[] }> {
    const alert = await this.alertRepository.create(input);

    let notifications: NotificationResult[] = [];
    if (notify) {
      notifications = await this.notifyAll(alert, notifyOptions);
    }

    return { alert, notifications };
  }

  /**
   * Crea una alerta desde una mención social
   * @requirements 12.1 - COMPLAINT crea alerta con HIGH/CRITICAL priority
   */
  async createAlertFromMention(
    mention: SocialMention,
    notify = true
  ): Promise<{ alert: Alert; notifications: NotificationResult[] }> {
    const priority = this.determinePriorityFromSentiment(mention.sentiment);
    const type = this.determineTypeFromSentiment(mention.sentiment);

    const input: CreateAlertInput = {
      type,
      priority,
      title: this.buildTitleFromMention(mention),
      content: mention.content,
      mentionId: mention.id,
      sourceId: mention.sourceId,
      context: {
        platform: mention.platform,
        author: mention.author,
        externalId: mention.externalId,
        sentiment: mention.sentiment,
        publishedAt: mention.publishedAt.toISOString(),
        suggestedResponse: mention.suggestedResponse,
      },
    };

    return this.createAlert(input, notify);
  }

  /**
   * Determina la prioridad basada en el sentimiento
   * COMPLAINT -> HIGH o CRITICAL
   * NEGATIVE -> MEDIUM
   * Otros -> LOW
   */
  private determinePriorityFromSentiment(sentiment: SentimentType): AlertPriority {
    switch (sentiment) {
      case SentimentType.COMPLAINT:
        return AlertPriority.HIGH;
      case SentimentType.NEGATIVE:
        return AlertPriority.MEDIUM;
      default:
        return AlertPriority.LOW;
    }
  }

  /**
   * Determina el tipo de alerta basado en el sentimiento
   */
  private determineTypeFromSentiment(sentiment: SentimentType): AlertType {
    switch (sentiment) {
      case SentimentType.COMPLAINT:
        return AlertType.COMPLAINT;
      default:
        return AlertType.MENTION;
    }
  }

  /**
   * Construye el título de la alerta desde la mención
   */
  private buildTitleFromMention(mention: SocialMention): string {
    const platformLabel = mention.platform.charAt(0).toUpperCase() + mention.platform.slice(1);
    const sentimentLabel = mention.sentiment === SentimentType.COMPLAINT ? 'Queja' : 'Mención';
    return `${sentimentLabel} en ${platformLabel} de @${mention.author}`;
  }

  /**
   * Envía notificación por todos los canales habilitados
   */
  async notifyAll(alert: Alert, options?: NotificationOptions): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const [, channel] of this.channels) {
      if (channel.isEnabled() || options?.force) {
        const result = await channel.notify(alert, options);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Envía notificación por un canal específico
   */
  async notifyChannel(
    channelName: string,
    alert: Alert,
    options?: NotificationOptions
  ): Promise<NotificationResult> {
    const channel = this.channels.get(channelName);

    if (!channel) {
      return {
        success: false,
        channel: channelName,
        error: `Channel '${channelName}' not found`,
      };
    }

    return channel.notify(alert, options);
  }

  /**
   * Obtiene alertas pendientes
   */
  async getPendingAlerts(limit?: number): Promise<Alert[]> {
    return this.alertRepository.findPending(limit);
  }

  /**
   * Obtiene alertas con filtros
   */
  async getAlerts(filters?: AlertFilters, limit?: number): Promise<Alert[]> {
    return this.alertRepository.findMany(filters, limit);
  }

  /**
   * Obtiene una alerta por ID
   */
  async getAlertById(id: string): Promise<Alert | null> {
    return this.alertRepository.findById(id);
  }

  /**
   * Reconoce una alerta
   * @requirements 12.4 - Marcar como revisada con timestamp
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    return this.alertRepository.acknowledge(alertId, userId);
  }

  /**
   * Obtiene estadísticas de alertas
   */
  async getAlertStats(fromDate?: Date, toDate?: Date): Promise<{
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    pending: number;
  }> {
    const [byType, byPriority, pendingAlerts] = await Promise.all([
      this.alertRepository.countByType(fromDate, toDate),
      this.alertRepository.countByPriority(fromDate, toDate),
      this.alertRepository.findPending(),
    ]);

    return {
      byType,
      byPriority,
      pending: pendingAlerts.length,
    };
  }

  /**
   * Crea una alerta de error del sistema
   */
  async createSystemErrorAlert(
    title: string,
    error: Error | string,
    context?: Record<string, unknown>
  ): Promise<{ alert: Alert; notifications: NotificationResult[] }> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    return this.createAlert({
      type: AlertType.SYSTEM_ERROR,
      priority: AlertPriority.HIGH,
      title,
      content: errorMessage,
      context: {
        ...context,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Crea una alerta de cambio de política
   */
  async createPolicyChangeAlert(
    title: string,
    content: string,
    sourceId?: string,
    context?: Record<string, unknown>
  ): Promise<{ alert: Alert; notifications: NotificationResult[] }> {
    return this.createAlert({
      type: AlertType.POLICY_CHANGE,
      priority: AlertPriority.CRITICAL,
      title,
      content,
      sourceId,
      context,
    });
  }
}
