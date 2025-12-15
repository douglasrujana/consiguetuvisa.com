// src/pages/api/sanity/revalidate.ts
/**
 * ============================================================================
 * WEBHOOK DE REVALIDACIÓN PARA SANITY CMS
 * ============================================================================
 * 
 * PROPÓSITO:
 * Cuando un editor publica cambios en Sanity, este webhook invalida
 * el cache SWR para que los cambios se vean inmediatamente.
 * 
 * CONFIGURACIÓN EN SANITY:
 * 1. Ir a sanity.io/manage → tu proyecto → API → Webhooks
 * 2. Crear nuevo webhook:
 *    - Name: "Revalidate Cache"
 *    - URL: https://tudominio.com/api/sanity/revalidate
 *    - Trigger on: Create, Update, Delete
 *    - Filter: _type in ["page", "siteSettings", "post"]
 *    - Secret: (generar uno seguro)
 * 3. Agregar SANITY_WEBHOOK_SECRET a tus variables de entorno
 * 
 * FLUJO:
 * 1. Editor publica cambio en Sanity
 * 2. Sanity envía POST a este endpoint
 * 3. Validamos el secret
 * 4. Invalidamos cache de la sección afectada
 * 5. Próxima visita carga datos frescos
 * 
 * ============================================================================
 */

import type { APIRoute } from 'astro';
import { invalidateCache, invalidateAllSanityCache, getCacheStats } from '$lib/sanity/cache';

// Secret para validar que el webhook viene de Sanity
const WEBHOOK_SECRET = import.meta.env.SANITY_WEBHOOK_SECRET || '';

// Mapeo de tipos de documento a keys de cache
const TYPE_TO_CACHE_KEY: Record<string, string[]> = {
  // Página home afecta múltiples secciones
  'page': [
    'sanity:hero',
    'sanity:benefits', 
    'sanity:services',
    'sanity:testimonials',
    'sanity:steps',
    'sanity:trust',
    'sanity:trustLogos',
    'sanity:faq',
    'sanity:contact',
  ],
  // Settings afecta header/footer
  'siteSettings': ['sanity:settings'],
  // Posts del blog (futuro)
  'post': ['sanity:posts'],
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validar secret (si está configurado)
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('sanity-webhook-secret');
      if (authHeader !== WEBHOOK_SECRET) {
        console.warn('[Sanity Webhook] Secret inválido');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Parsear body del webhook
    const body = await request.json();
    const { _type, _id } = body;

    console.log(`[Sanity Webhook] Recibido: tipo=${_type}, id=${_id}`);

    // Determinar qué cache invalidar
    const keysToInvalidate = TYPE_TO_CACHE_KEY[_type] || [];

    if (keysToInvalidate.length > 0) {
      // Invalidar caches específicos
      keysToInvalidate.forEach(key => invalidateCache(key));
      
      console.log(`[Sanity Webhook] Cache invalidado: ${keysToInvalidate.join(', ')}`);
      
      return new Response(JSON.stringify({
        success: true,
        invalidated: keysToInvalidate,
        message: `Cache invalidado para ${_type}`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tipo no mapeado - invalidar todo por seguridad
    invalidateAllSanityCache();
    
    return new Response(JSON.stringify({
      success: true,
      invalidated: ['all'],
      message: `Tipo ${_type} no mapeado, cache completo invalidado`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Sanity Webhook] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error procesando webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET: Endpoint para ver estadísticas del cache (solo desarrollo)
 * 
 * @example
 * curl http://localhost:4321/api/sanity/revalidate
 */
export const GET: APIRoute = async () => {
  const stats = getCacheStats();
  
  return new Response(JSON.stringify({
    cache: stats,
    config: {
      staleTime: '30 segundos',
      maxAge: '5 minutos',
    },
    hint: 'POST a este endpoint para invalidar cache manualmente',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
