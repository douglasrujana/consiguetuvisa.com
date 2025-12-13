// src/pages/api/solicitudes/index.ts
// API para solicitudes del usuario

import type { APIRoute } from 'astro';
import { getBasicServices } from '../../../server/lib/core/di/ContextFactory';
import { CreateSolicitudSchema } from '../../../server/lib/features/solicitud/Solicitud.dto';
import { ZodError } from 'zod';

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
    const solicitudes = await solicitudService.getSolicitudesByUser(userId);

    return new Response(JSON.stringify({ data: solicitudes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/solicitudes:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { auth } = locals;
    const { userId } = auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const validatedData = CreateSolicitudSchema.parse(body);
    
    const { solicitudService } = getBasicServices();
    const solicitud = await solicitudService.createSolicitud(validatedData, userId);

    return new Response(JSON.stringify(solicitud), {
      status: 201,
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
    
    console.error('Error POST /api/solicitudes:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
