// src/pages/api/admin/users/[id].ts
// API para operaciones individuales de CUSTOMER (cliente)

import type { APIRoute } from 'astro';
import { prisma } from '../../../../server/db/prisma-singleton';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { localUser, staff } = locals as any;
    const currentUser = staff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV', 'SALES'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            solicitudes: true,
            conversations: true,
            documents: true,
          }
        }
      },
    });

    if (!customer) {
      return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(customer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/admin/users/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { localUser, staff } = locals as any;
    const currentUser = staff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { firstName, lastName, phone, status, source, isActive } = body;

    // Verificar que existe
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(status !== undefined && { status }),
        ...(source !== undefined && { source }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return new Response(JSON.stringify(customer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error PATCH /api/admin/users/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { localUser, staff } = locals as any;
    const currentUser = staff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    // Verificar que existe
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que no tiene solicitudes activas
    const activeSolicitudes = await prisma.solicitud.count({
      where: { customerId: id, status: { notIn: ['CANCELADA', 'RECHAZADA', 'APROBADA'] } }
    });
    
    if (activeSolicitudes > 0) {
      return new Response(JSON.stringify({ 
        error: `No se puede eliminar: tiene ${activeSolicitudes} solicitud(es) activa(s)` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.customer.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error DELETE /api/admin/users/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
