// src/server/lib/adapters/email/Email.port.ts

/**
 * PUERTO DE EMAIL
 * Contrato que deben cumplir todos los proveedores de email.
 * Anti vendor-locking: Resend, SendGrid, SES, etc.
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  /**
   * Envía un email.
   */
  send(message: EmailMessage): Promise<EmailResult>;

  /**
   * Envía múltiples emails.
   */
  sendBatch(messages: EmailMessage[]): Promise<EmailResult[]>;

  /**
   * Verifica si el proveedor está configurado correctamente.
   */
  isConfigured(): boolean;
}
