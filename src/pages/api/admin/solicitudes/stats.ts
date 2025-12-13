// src/pages/api/admin/solicitudes/stats.ts
// API de estadísticas globales para admin

import type { APIRoute } from 'astro';
import { getBasicServices } from '../../../../server/lib/core/di/ContextFactory';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { solicitudService } = getBasicServices();
    const stats = await solicitudService.getDashboardStats();

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/admin/solicitudes/stats:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
