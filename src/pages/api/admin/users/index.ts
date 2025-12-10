// src/pages/api/admin/users/index.ts
// API CRUD de usuarios para admin

import type { APIRoute } from 'astro';
import { prisma } from '../../../../server/db/prisma-singleton';

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const { localUser } = locals as any;
    
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parsear filtros
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construir where
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

    // Ejecutar queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
        },
      }),
      prisma.user.count({ where }),
    ]);

    return new Response(JSON.stringify({ data: users, total, page, limit }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error GET /api/admin/users:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { localUser } = locals as any;
    
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, role, isActive } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar si ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'El email ya está registrado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        role: role || 'USER',
        isActive: isActive ?? true,
      },
    });

    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error POST /api/admin/users:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
