// src/pages/api/admin/social/config.ts
// API para configuración de Social Listening

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';
import { SocialSyncService } from '@features/social/SocialSync.service';

// GET - Obtener configuración actual
export const GET: APIRoute = async () => {
  try {
    const syncService = new SocialSyncService(prisma);
    const config = await syncService.getConfig();

    // Ocultar tokens sensibles (mostrar solo si están configurados)
    const safeConfig = {
      twitter: {
        enabled: config.twitter?.enabled || false,
        hasToken: !!config.twitter?.bearerToken,
        searchQuery: config.twitter?.searchQuery || '@ConsigueTuVisa',
      },
      facebook: {
        enabled: config.facebook?.enabled || false,
        hasToken: !!config.facebook?.accessToken,
        pageId: config.facebook?.pageId || '',
        instagramAccountId: config.facebook?.instagramAccountId || '',
      },
    };

    return new Response(JSON.stringify(safeConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Social Config API Error]', error);
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });
  }
};

// PUT - Actualizar configuración
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const syncService = new SocialSyncService(prisma);

    await syncService.saveConfig(body);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Social Config API Error]', error);
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });
  }
};
