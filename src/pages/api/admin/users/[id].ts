// src/pages/api/admin/users/[id].ts
// API para operaciones individuales de usuario

import type { APIRoute } from 'astro';
import { prisma } from '../../../../server/db/prisma-singleton';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { localUser } = locals as any;
    
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(user), {
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
    const { localUser } = locals as any;
    
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { firstName, lastName, phone, role, isActive } = body;

    // Verificar que existe
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No permitir que un admin se quite el rol a sí mismo
    if (existing.id === localUser.id && role && role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No puedes quitarte el rol de admin' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return new Response(JSON.stringify(user), {
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
    const { localUser } = locals as any;
    
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    // No permitir auto-eliminación
    if (id === localUser.id) {
      return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que existe
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.user.delete({ where: { id } });

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
