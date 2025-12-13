// src/pages/api/auth/sync-redirect.ts
// Sincroniza usuario y redirige al dashboard

import type { APIRoute } from 'astro';
import { createClerkClient } from '@clerk/astro/server';
import { getBasicServices } from '@core/di/ContextFactory';
import { validateCreateUserFromClerk } from '@features/user';

export const GET: APIRoute = async ({ locals, redirect }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();

    if (!userId) {
      return redirect('/login');
    }

    // Crear cliente de Clerk
    const clerk = createClerkClient({
      secretKey: import.meta.env.CLERK_SECRET_KEY,
      publishableKey: import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

    // Obtener datos del usuario desde Clerk API
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (email) {
      const validatedData = validateCreateUserFromClerk({
        externalId: userId,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      });

      const { userService } = getBasicServices();
      await userService.syncFromClerk(validatedData);
      
      console.log('[Auth Sync] User synced:', email);
    }

    return redirect('/dashboard');
  } catch (error) {
    console.error('[Auth Sync] Error:', error);
    return redirect('/dashboard?error=sync_failed');
  }
};
