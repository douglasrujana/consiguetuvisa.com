// src/pages/api/auth/sync.ts
// Endpoint para sincronizar usuario de Clerk a Turso
// Se llama desde el frontend después del registro/login

import type { APIRoute } from 'astro';
import { getBasicServices } from '@core/di/ContextFactory';
import { validateCreateUserFromClerk } from '@features/user';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { auth } = locals;
    const { userId, sessionClaims } = auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const claims = sessionClaims as Record<string, any> | null;
    const email = claims?.email || claims?.primary_email_address || claims?.emailAddress;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email no disponible en sesión' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar datos
    const validatedData = validateCreateUserFromClerk({
      externalId: userId,
      email,
      firstName: claims?.first_name || claims?.firstName,
      lastName: claims?.last_name || claims?.lastName,
    });

    // Sincronizar usuario
    const { userService } = getBasicServices();
    const user = await userService.syncFromClerk(validatedData);

    return new Response(
      JSON.stringify({
        success: true,
        user: userService.toResponseDTO(user),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Auth Sync] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error sincronizando usuario' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
