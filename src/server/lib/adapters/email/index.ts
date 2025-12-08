// src/server/lib/adapters/email/index.ts
// Factory de proveedores de email

import type { IEmailProvider } from './Email.port';
import { ResendEmailAdapter } from './ResendEmail.adapter';
import { ConsoleEmailAdapter } from './ConsoleEmail.adapter';
import { config } from '../../core/config';

export type { IEmailProvider, EmailMessage, EmailResult, EmailAttachment } from './Email.port';
export { ResendEmailAdapter } from './ResendEmail.adapter';
export { ConsoleEmailAdapter } from './ConsoleEmail.adapter';

/**
 * Factory que crea el proveedor de email según la configuración.
 * Anti vendor-locking: agregar nuevos proveedores es trivial.
 */
export function createEmailProvider(): IEmailProvider {
  if (!config.email.enabled) {
    console.log('[Email] Deshabilitado por configuración');
    return new ConsoleEmailAdapter();
  }

  switch (config.email.provider) {
    case 'resend':
      const resend = new ResendEmailAdapter();
      if (!resend.isConfigured()) {
        console.warn('[Email] Resend no configurado, usando Console');
        return new ConsoleEmailAdapter();
      }
      return resend;

    case 'sendgrid':
      // TODO: Implementar SendGridEmailAdapter
      console.warn('[Email] SendGrid no implementado, usando Console');
      return new ConsoleEmailAdapter();

    case 'ses':
      // TODO: Implementar SESEmailAdapter
      console.warn('[Email] SES no implementado, usando Console');
      return new ConsoleEmailAdapter();

    case 'console':
    default:
      return new ConsoleEmailAdapter();
  }
}

// Singleton del proveedor de email
let _emailProvider: IEmailProvider | null = null;

export function getEmailProvider(): IEmailProvider {
  if (!_emailProvider) {
    _emailProvider = createEmailProvider();
  }
  return _emailProvider;
}
