// src/pages/api/admin/staff/index.ts
// API CRUD de STAFF MEMBERS (equipo interno)

import type { APIRoute } from 'astro';
import { prisma } from '../../../../server/db/prisma-singleton';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { localUser, staff: currentStaff } = locals as any;
    const currentUser = currentStaff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    
    if (role) {
      where.role = role;
    }

    const [staff, total] = await Promise.all([
      prisma.staffMember.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          isActive: true,
          clerkId: true,
          createdAt: true,
        },
      }),
      prisma.staffMember.count({ where }),
    ]);

    return new Response(JSON.stringify({ data: staff, total, page, limit }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/admin/staff:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { localUser, staff: currentStaff } = locals as any;
    const currentUser = currentStaff || localUser;
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Solo ADMIN puede crear miembros del equipo' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, firstName, lastName, role, department, isActive } = body;

    if (!email || !firstName || !lastName || !role) {
      return new Response(JSON.stringify({ error: 'Email, nombre, apellido y rol son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar si ya existe
    const existing = await prisma.staffMember.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'El email ya está registrado en el equipo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const staff = await prisma.staffMember.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        department: department || null,
        isActive: isActive ?? true,
        invitedBy: currentUser.id,
      },
    });

    return new Response(JSON.stringify(staff), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error POST /api/admin/staff:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
