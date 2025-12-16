// src/pages/api/admin/social/[id].ts
// API REST para operaciones individuales de menciones

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';
import { SocialMentionRepository } from '@features/social';

// GET - Obtener mención por ID
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    }

    const repo = new SocialMentionRepository(prisma);
    const mention = await repo.findById(id);

    if (!mention) {
      return new Response(JSON.stringify({ error: 'Mención no encontrada' }), { status: 404 });
    }

    return new Response(JSON.stringify(mapMention(mention)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Social API Error]', error);
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });
  }
};

// PUT - Actualizar mención (marcar revisada, cambiar sentimiento, etc.)
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    }

    const body = await request.json();
    const repo = new SocialMentionRepository(prisma);

    // Si viene reviewedBy, marcar como revisada
    if (body.reviewedBy) {
      const mention = await repo.markAsReviewed(id, body.reviewedBy);
      return new Response(JSON.stringify(mapMention(mention)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Actualizar otros campos
    const updateData: any = {};
    if (body.sentiment) updateData.sentiment = body.sentiment;
    if (body.suggestedResponse !== undefined) updateData.suggestedResponse = body.suggestedResponse;

    const mention = await repo.update(id, updateData);
    return new Response(JSON.stringify(mapMention(mention)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Social API Error]', error);
    return new Response(JSON.stringify({ error: 'Error actualizando' }), { status: 500 });
  }
};

// DELETE - Eliminar mención
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    }

    const repo = new SocialMentionRepository(prisma);
    await repo.delete(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Social API Error]', error);
    return new Response(JSON.stringify({ error: 'Error eliminando' }), { status: 500 });
  }
};

function mapMention(m: any) {
  return {
    id: m.id,
    sourceId: m.sourceId,
    platform: m.platform,
    externalId: m.externalId,
    author: m.author,
    content: m.content,
    sentiment: m.sentiment,
    suggestedResponse: m.suggestedResponse,
    reviewedAt: m.reviewedAt?.toISOString() ?? null,
    reviewedBy: m.reviewedBy,
    publishedAt: m.publishedAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  };
}
