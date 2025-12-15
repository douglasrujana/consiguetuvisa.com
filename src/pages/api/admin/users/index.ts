// src/pages/api/admin/users/index.ts
// API CRUD de CUSTOMERS (clientes externos) para admin
// Para StaffMembers usar /api/admin/staff

import type { APIRoute } from 'astro';
import { prisma } from '../../../../server/db/prisma-singleton';

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const { localUser, staff } = locals as any;
    const currentUser = staff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV', 'SALES'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parsear filtros
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construir where para Customer
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Ejecutar queries en Customer (no User)
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
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
          status: true,
          source: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              solicitudes: true,
              conversations: true,
            }
          }
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Mapear para compatibilidad con UI existente
    const data = customers.map(c => ({
      ...c,
      role: c.status, // Mapear status a role para UI
      solicitudesCount: c._count.solicitudes,
      conversationsCount: c._count.conversations,
    }));

    return new Response(JSON.stringify({ data, total, page, limit }), {
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
    const { localUser, staff } = locals as any;
    const currentUser = staff || localUser;
    
    if (!currentUser || !['ADMIN', 'DEV'].includes(currentUser.role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, status, source, isActive } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar si ya existe en Customer
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'El email ya está registrado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customer = await prisma.customer.create({
      data: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        status: status || 'LEAD',
        source: source || 'ADMIN',
        isActive: isActive ?? true,
      },
    });

    return new Response(JSON.stringify(customer), {
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
