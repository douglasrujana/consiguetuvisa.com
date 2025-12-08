// src/pages/api/webhooks/clerk.ts
// Webhook de Clerk para sincronizar usuarios con SQLite

import type { APIRoute } from 'astro';
import { getServices } from '@core/di/ContextFactory';
import { validateCreateUserFromClerk } from '@features/user';

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; verification?: { status: string } }>;
    first_name?: string | null;
    last_name?: string | null;
  };
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // En producción, verificar firma SVIX
    const webhookSecret = import.meta.env.CLERK_WEBHOOK_SECRET;
    if (import.meta.env.PROD && webhookSecret) {
      // TODO: Verificar firma SVIX
    }

    const event: ClerkWebhookEvent = await request.json();
    const { userService } = getServices();

    console.log(`[Clerk Webhook] Event: ${event.type}`, { userId: event.data.id });

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const email = event.data.email_addresses?.[0]?.email_address;
        if (!email) {
          return new Response('No email', { status: 400 });
        }

        // Validar en capa de entrada
        const validatedData = validateCreateUserFromClerk({
          externalId: event.data.id,
          email,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          emailVerified: event.data.email_addresses?.[0]?.verification?.status === 'verified',
        });

        const user = await userService.syncFromClerk(validatedData);

        console.log(`[Clerk Webhook] User synced:`, { id: user.id, email: user.email });

        return new Response(JSON.stringify({ success: true, userId: user.id }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'user.deleted': {
        await userService.deactivateUser(event.data.id);
        console.log(`[Clerk Webhook] User deactivated:`, { externalId: event.data.id });

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[Clerk Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
