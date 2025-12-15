// src/pages/api/admin/staff/[id].ts
// API para operaciones individuales de StaffMember

import type { APIRoute } from 'astro';
import { prisma } from '../../../../server/db/prisma-singleton';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { localUser, staff: currentStaff } = locals as any;
    const currentUser = currentStaff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    const staff = await prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staff) {
      return new Response(JSON.stringify({ error: 'Miembro no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(staff), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/admin/staff/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { localUser, staff: currentStaff } = locals as any;
    const currentUser = currentStaff || localUser;
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Solo ADMIN puede editar miembros' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { firstName, lastName, role, department, isActive } = body;

    const existing = await prisma.staffMember.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Miembro no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No permitir que un admin se quite el rol a sí mismo
    if (existing.id === currentUser.id && role && role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No puedes quitarte el rol de ADMIN' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const staff = await prisma.staffMember.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(role !== undefined && { role }),
        ...(department !== undefined && { department }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return new Response(JSON.stringify(staff), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error PATCH /api/admin/staff/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { localUser, staff: currentStaff } = locals as any;
    const currentUser = currentStaff || localUser;
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Solo ADMIN puede eliminar miembros' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;

    // No permitir auto-eliminación
    if (id === currentUser.id) {
      return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await prisma.staffMember.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Miembro no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.staffMember.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error DELETE /api/admin/staff/[id]:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
