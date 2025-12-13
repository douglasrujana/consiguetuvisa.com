// src/pages/api/admin/solicitudes/index.ts
// API de administración para solicitudes

import type { APIRoute } from 'astro';
import { getBasicServices } from '../../../../server/lib/core/di/ContextFactory';
import { SolicitudFiltersSchema } from '../../../../server/lib/features/solicitud/Solicitud.dto';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parsear filtros de query params
    const filters = SolicitudFiltersSchema.parse({
      status: url.searchParams.get('status') || undefined,
      visaType: url.searchParams.get('visaType') || undefined,
      priority: url.searchParams.get('priority') || undefined,
      search: url.searchParams.get('search') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
    });

    const { solicitudService } = getBasicServices();
    const result = await solicitudService.listSolicitudes(filters);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/admin/solicitudes:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
