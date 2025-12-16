// src/pages/api/admin/social/sync.ts
// API para sincronizar menciones desde redes sociales

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';
import { SocialSyncService } from '@features/social/SocialSync.service';
import { AIService } from '@core/ai';

// POST - Ejecutar sincronización
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const platform = body.platform; // 'twitter' | 'facebook' | undefined (all)

    // Crear AIService si hay API key
    let aiService: AIService | undefined;
    if (process.env.GEMINI_API_KEY) {
      aiService = new AIService();
    }

    const syncService = new SocialSyncService(prisma, aiService);
    const config = await syncService.getConfig();

    let results;

    if (platform === 'twitter') {
      if (!config.twitter?.enabled) {
        return new Response(
          JSON.stringify({ error: 'Twitter no está habilitado' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      results = [await syncService.syncTwitter(config.twitter)];
    } else if (platform === 'facebook') {
      if (!config.facebook?.enabled) {
        return new Response(
          JSON.stringify({ error: 'Facebook no está habilitado' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      results = [await syncService.syncFacebook(config.facebook)];
    } else {
      results = await syncService.syncAll();
    }

    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.new, 0);
    const errors = results.flatMap((r) => r.errors);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalFetched,
          totalNew,
          errors: errors.length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Social Sync API Error]', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET - Probar conexiones
export const GET: APIRoute = async ({ url }) => {
  try {
    const platform = url.searchParams.get('test');
    const syncService = new SocialSyncService(prisma);

    if (platform === 'twitter') {
      const result = await syncService.testTwitterConnection();
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (platform === 'facebook') {
      const result = await syncService.testFacebookConnection();
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sin parámetro, retornar estado de configuración
    const config = await syncService.getConfig();
    return new Response(
      JSON.stringify({
        twitter: {
          configured: !!config.twitter?.bearerToken,
          enabled: config.twitter?.enabled,
        },
        facebook: {
          configured: !!config.facebook?.accessToken,
          enabled: config.facebook?.enabled,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Social Sync API Error]', error);
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });
  }
};
