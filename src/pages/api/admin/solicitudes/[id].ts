// src/pages/api/admin/solicitudes/[id].ts
// API para detalle y actualización de solicitud

import type { APIRoute } from 'astro';
import { getBasicServices } from '../../../../server/lib/core/di/ContextFactory';
import { UpdateSolicitudSchema } from '../../../../server/lib/features/solicitud/Solicitud.dto';
import { ZodError } from 'zod';

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { solicitudService } = getBasicServices();
    const solicitud = await solicitudService.getSolicitudById(id);

    return new Response(JSON.stringify(solicitud), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return new Response(JSON.stringify({ error: 'Solicitud no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.error('Error GET /api/admin/solicitudes/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const validatedData = UpdateSolicitudSchema.parse(body);

    const { solicitudService } = getBasicServices();
    const solicitud = await solicitudService.updateSolicitud(id, validatedData, userId);

    return new Response(JSON.stringify(solicitud), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.error('Error PATCH /api/admin/solicitudes/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
