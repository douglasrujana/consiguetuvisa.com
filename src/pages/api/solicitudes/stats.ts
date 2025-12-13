// src/pages/api/solicitudes/stats.ts
// API para estadísticas del usuario

import type { APIRoute } from 'astro';
import { getBasicServices } from '../../../server/lib/core/di/ContextFactory';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    // Permitir pasar userId como query param (para el dashboard)
    const queryUserId = url.searchParams.get('userId');
    const targetUserId = queryUserId || userId;
    
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el usuario solo pueda ver sus propias stats
    if (queryUserId && queryUserId !== userId) {
      // TODO: Verificar si es admin
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { solicitudService } = getBasicServices();
    const stats = await solicitudService.getUserStats(targetUserId);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/solicitudes/stats:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
