// src/pages/api/admin/setup.ts
// Endpoint para promover el primer usuario a ADMIN

import type { APIRoute } from 'astro';
import { getServices } from '@core/di/ContextFactory';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userService } = getServices();
    const user = await userService.promoteFirstAdmin(userId);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'No se pudo promover a admin',
          message: 'Ya existe un administrador o el usuario no existe',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Admin Setup] First admin created:', user.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ahora eres administrador',
        user: userService.toResponseDTO(user),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin Setup] Error:', error);
    return new Response(JSON.stringify({ error: 'Error al configurar admin' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
