// src/pages/api/admin/solicitudes/stats.ts
// API de estadísticas globales para admin

import type { APIRoute } from 'astro';
import { buildContext } from '../../../../server/lib/core/di/ContextFactory';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Verificar rol de admin

    const context = buildContext(request);
    const stats = await context.solicitudService.getDashboardStats();

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
