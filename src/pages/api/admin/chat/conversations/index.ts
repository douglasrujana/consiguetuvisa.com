// GET /api/admin/chat/conversations
// Lista conversaciones del chatbot con stats y filtros

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Verificar autenticación admin
    const { localUser } = locals as any;
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filtros desde query params
    const search = url.searchParams.get('search') || '';
    const customerId = url.searchParams.get('customerId') || url.searchParams.get('userId') || '';
    const onlyCustomers = url.searchParams.get('onlyUsers') === 'true' || url.searchParams.get('onlyCustomers') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Construir filtro
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { messages: { some: { content: { contains: search } } } }
      ];
    }
    if (customerId) where.customerId = customerId;
    if (onlyCustomers) where.customerId = { not: null };

    const [conversations, total, todayCount, totalAll] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { messages: true } },
          messages: { take: 1, orderBy: { createdAt: 'asc' }, select: { content: true } }
        }
      }),
      prisma.conversation.count({ where }),
      prisma.conversation.count({ where: { createdAt: { gte: today } } }),
      prisma.conversation.count()
    ]);

    // Calcular promedio de mensajes
    const totalMessages = conversations.reduce((sum, c) => sum + (c._count?.messages || 0), 0);
    const avgMessages = conversations.length > 0 ? totalMessages / conversations.length : 0;

    // Métricas adicionales
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [weekCount, withCustomersCount, recentConvs] = await Promise.all([
      prisma.conversation.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.conversation.count({ where: { customerId: { not: null } } }),
      prisma.conversation.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Agrupar por día de la semana
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const byDay = dayNames.map(() => 0);
    recentConvs.forEach(c => {
      const day = new Date(c.createdAt).getDay();
      byDay[day]++;
    });
    const chartData = dayNames.map((name, i) => ({ name, value: byDay[i] }));

    // Agregar preview del primer mensaje
    const conversationsWithPreview = conversations.map(c => ({
      ...c,
      preview: c.messages[0]?.content?.substring(0, 100) || null,
      messages: undefined // No enviar mensajes completos en lista
    }));

    return new Response(JSON.stringify({
      conversations: conversationsWithPreview,
      stats: { 
        total: totalAll, 
        today: todayCount, 
        avgMessages,
        thisWeek: weekCount,
        withCustomers: withCustomersCount,
        withUsers: withCustomersCount, // Compatibilidad
        anonymous: totalAll - withCustomersCount
      },
      chartData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
