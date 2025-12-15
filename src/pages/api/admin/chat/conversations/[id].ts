// GET/DELETE /api/admin/chat/conversations/[id]
// Obtiene mensajes o elimina una conversación

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Verificar autenticación admin
    const { localUser } = locals as any;
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({
      conversation,
      messages: conversation.messages
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Verificar autenticación admin
    const { localUser } = locals as any;
    if (!localUser || localUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });
    }

    await prisma.conversation.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
