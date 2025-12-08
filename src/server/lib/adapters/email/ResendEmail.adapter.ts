// src/server/lib/adapters/email/ResendEmail.adapter.ts

/**
 * ADAPTADOR DE RESEND
 * Implementación del puerto IEmailProvider usando Resend.
 * Para cambiar a SendGrid, solo crea SendGridEmail.adapter.ts
 */

import { Resend } from 'resend';
import type { IEmailProvider, EmailMessage, EmailResult } from './Email.port';
import { config } from '../../core/config';

export class ResendEmailAdapter implements IEmailProvider {
  private client: Resend | null = null;
  private from: string;
  private defaultReplyTo?: string;

  constructor() {
    const apiKey = config.email.apiKey;
    this.from = config.email.from;
    this.defaultReplyTo = config.email.replyTo;

    if (apiKey) {
      this.client = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Resend no está configurado. Falta RESEND_API_KEY.',
      };
    }

    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo || this.defaultReplyTo,
        cc: message.cc,
        bcc: message.bcc,
        attachments: message.attachments?.map(a => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
        })),
        tags: message.tags ? Object.entries(message.tags).map(([name, value]) => ({ name, value })) : undefined,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<EmailResult[]> {
    return Promise.all(messages.map(m => this.send(m)));
  }
}
