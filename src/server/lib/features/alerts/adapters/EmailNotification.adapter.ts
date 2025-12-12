// src/server/lib/features/alerts/adapters/EmailNotification.adapter.ts

/**
 * ADAPTADOR EMAIL NOTIFICATION
 * Implementación del canal de notificación por email usando Resend.
 * 
 * @requirements 12.1 - Notificación por email de alertas
 */

import type { IEmailProvider } from '../../../adapters/email/Email.port';
import type { INotificationChannel, NotificationOptions } from '../NotificationChannel.port';
import type { Alert, NotificationResult } from '../Alert.entity';
import { AlertPriority, AlertType } from '../Alert.entity';
import { config } from '../../../core/config';

export class EmailNotificationAdapter implements INotificationChannel {
  readonly name = 'email';
  private recipients: string[];

  constructor(
    private emailProvider: IEmailProvider,
    recipients?: string[]
  ) {
    // Default recipients from env or config
    const defaultRecipient = process.env.ALERT_EMAIL_TO || config.app.supportEmail;
    this.recipients = recipients || [defaultRecipient];
  }

  isConfigured(): boolean {
    return this.emailProvider.isConfigured();
  }

  isEnabled(): boolean {
    return this.isConfigured() && config.features.emailNotifications;
  }

  async notify(alert: Alert, options?: NotificationOptions): Promise<NotificationResult> {
    if (!this.isEnabled() && !options?.force) {
      return {
        success: false,
        channel: this.name,
        error: 'Email notifications are disabled',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        channel: this.name,
        error: 'Email provider is not configured',
      };
    }

    const recipients = [
      ...this.recipients,
      ...(options?.additionalRecipients || []),
    ];

    const subject = this.buildSubject(alert);
    const html = this.buildHtmlContent(alert);
    const text = this.buildTextContent(alert);

    try {
      const result = await this.emailProvider.send({
        to: recipients,
        subject,
        html,
        text,
        tags: {
          alertType: alert.type,
          alertPriority: alert.priority,
          alertId: alert.id,
        },
      });

      return {
        success: result.success,
        channel: this.name,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        channel: this.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildSubject(alert: Alert): string {
    const priorityEmoji = this.getPriorityEmoji(alert.priority);
    const typeLabel = this.getTypeLabel(alert.type);
    return `${priorityEmoji} [${typeLabel}] ${alert.title}`;
  }

  private getPriorityEmoji(priority: AlertPriority): string {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return '🚨';
      case AlertPriority.HIGH:
        return '⚠️';
      case AlertPriority.MEDIUM:
        return '📢';
      case AlertPriority.LOW:
        return 'ℹ️';
      default:
        return '📌';
    }
  }

  private getTypeLabel(type: AlertType): string {
    switch (type) {
      case AlertType.COMPLAINT:
        return 'Queja';
      case AlertType.POLICY_CHANGE:
        return 'Cambio de Política';
      case AlertType.SYSTEM_ERROR:
        return 'Error del Sistema';
      case AlertType.MENTION:
        return 'Mención';
      default:
        return 'Alerta';
    }
  }

  private buildHtmlContent(alert: Alert): string {
    const priorityColor = this.getPriorityColor(alert.priority);
    const contextHtml = alert.context
      ? `<h3>Contexto:</h3><pre style="background:#f5f5f5;padding:10px;border-radius:4px;">${JSON.stringify(alert.context, null, 2)}</pre>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .priority-critical { background: #dc2626; color: white; }
    .priority-high { background: #ea580c; color: white; }
    .priority-medium { background: #ca8a04; color: white; }
    .priority-low { background: #2563eb; color: white; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">${alert.title}</h1>
      <span class="badge priority-${alert.priority.toLowerCase()}">${alert.priority}</span>
      <span class="badge" style="background:#6b7280;color:white;">${this.getTypeLabel(alert.type)}</span>
    </div>
    <div class="content">
      <p>${alert.content}</p>
      ${contextHtml}
      <div class="footer">
        <p><strong>ID de Alerta:</strong> ${alert.id}</p>
        <p><strong>Fecha:</strong> ${alert.createdAt.toLocaleString('es-ES')}</p>
        ${alert.mentionId ? `<p><strong>ID de Mención:</strong> ${alert.mentionId}</p>` : ''}
        <p style="margin-top:15px;">
          <a href="${config.app.url}/admin/alerts/${alert.id}" style="background:${priorityColor};color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">
            Ver en Dashboard
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getPriorityColor(priority: AlertPriority): string {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return '#dc2626';
      case AlertPriority.HIGH:
        return '#ea580c';
      case AlertPriority.MEDIUM:
        return '#ca8a04';
      case AlertPriority.LOW:
        return '#2563eb';
      default:
        return '#6b7280';
    }
  }

  private buildTextContent(alert: Alert): string {
    const lines = [
      `[${alert.priority}] ${this.getTypeLabel(alert.type)}: ${alert.title}`,
      '',
      alert.content,
      '',
      '---',
      `ID de Alerta: ${alert.id}`,
      `Fecha: ${alert.createdAt.toLocaleString('es-ES')}`,
    ];

    if (alert.mentionId) {
      lines.push(`ID de Mención: ${alert.mentionId}`);
    }

    if (alert.context) {
      lines.push('', 'Contexto:', JSON.stringify(alert.context, null, 2));
    }

    lines.push('', `Ver en Dashboard: ${config.app.url}/admin/alerts/${alert.id}`);

    return lines.join('\n');
  }
}
