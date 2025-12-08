// src/server/lib/adapters/email/ConsoleEmail.adapter.ts

/**
 * ADAPTADOR DE CONSOLA
 * Para desarrollo y testing. Solo loguea los emails.
 */

import type { IEmailProvider, EmailMessage, EmailResult } from './Email.port';

export class ConsoleEmailAdapter implements IEmailProvider {
  isConfigured(): boolean {
    return true; // Siempre disponible
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const messageId = `console-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('\n📧 ═══════════════════════════════════════════════════════');
    console.log('   EMAIL (Console Adapter - Development Mode)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   To:      ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);
    console.log(`   Subject: ${message.subject}`);
    if (message.replyTo) console.log(`   ReplyTo: ${message.replyTo}`);
    if (message.cc?.length) console.log(`   CC:      ${message.cc.join(', ')}`);
    console.log('───────────────────────────────────────────────────────────');
    if (message.text) {
      console.log('   [TEXT]');
      console.log(`   ${message.text.substring(0, 500)}${message.text.length > 500 ? '...' : ''}`);
    }
    if (message.html) {
      console.log('   [HTML] (truncated)');
      // Extraer texto del HTML para preview
      const textPreview = message.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200);
      console.log(`   ${textPreview}...`);
    }
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Message ID: ${messageId}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      success: true,
      messageId,
    };
  }

  async sendBatch(messages: EmailMessage[]): Promise<EmailResult[]> {
    return Promise.all(messages.map(m => this.send(m)));
  }
}
