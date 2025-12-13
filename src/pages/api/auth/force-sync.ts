// src/pages/api/auth/force-sync.ts
// Fuerza sincronización del usuario actual

import type { APIRoute } from 'astro';
import { createClerkClient } from '@clerk/astro/server';
import { getBasicServices } from '@core/di/ContextFactory';
import { validateCreateUserFromClerk } from '@features/user';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear cliente de Clerk con las keys del env
    const clerk = createClerkClient({
      secretKey: import.meta.env.CLERK_SECRET_KEY,
      publishableKey: import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

    // Obtener datos del usuario desde Clerk API
    const clerkUser = await clerk.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Usuario sin email', clerkUser }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar y sincronizar
    const validatedData = validateCreateUserFromClerk({
      externalId: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    });

    const { userService } = getBasicServices();
    const user = await userService.syncFromClerk(validatedData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario sincronizado a Turso',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Force Sync] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
