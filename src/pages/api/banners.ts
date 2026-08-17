// GET /api/banners
// API pública para obtener banners activos

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';

export interface PublicBanner {
  id: string;
  type: string;
  message: string;
  link?: string;
  linkText?: string;
  dismissible: boolean;
  bgColor?: string;
  textColor?: string;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const currentPage = url.searchParams.get('page') || '/';
    const systemBanners: PublicBanner[] = [];

    // ── Banner 1: Entorno de pruebas ────────────────────────────────────────
    const nodeEnv = import.meta.env.MODE || 'development';
    const publicAppUrl = import.meta.env.PUBLIC_APP_URL || '';
    const isProdDomain = publicAppUrl.includes('consiguetuvisa.com') &&
      !publicAppUrl.includes('preview') && !publicAppUrl.includes('staging');

    if (!isProdDomain) {
      systemBanners.push({
        id: 'env-testing',
        type: 'environment',
        message: `🧪 Entorno de Pruebas — ${nodeEnv.toUpperCase()}`,
        dismissible: false,
      });
    }

    // ── Banner 2: Sanity sin token (modo fallback) ───────────────────────────
    const sanityToken = import.meta.env.SANITY_API_TOKEN;
    const isDev = nodeEnv === 'development' || nodeEnv === 'preview';

    if (!sanityToken && isDev) {
      systemBanners.push({
        id: 'sanity-fallback',
        type: 'warning',
        message: '⚠️ CMS Sanity sin token — el contenido se muestra desde datos locales de fallback.',
        dismissible: true,
      });
    }

    // ── Banners desde Base de Datos (configurados por el admin) ─────────────

    
    // Obtener banners de la BD
    const bannersConfig = await prisma.systemConfig.findUnique({
      where: { key: 'banners' }
    });
    
    if (!bannersConfig?.value) {
      return new Response(JSON.stringify(systemBanners), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const allBanners = JSON.parse(bannersConfig.value);
    const now = new Date();
    
    // Filtrar banners activos
    const activeBanners: PublicBanner[] = allBanners
      .filter((b: any) => {
        // Debe estar habilitado
        if (!b.enabled) return false;
        
        // Verificar fechas si están definidas
        if (b.startDate && new Date(b.startDate) > now) return false;
        if (b.endDate && new Date(b.endDate) < now) return false;
        
        // Verificar página objetivo
        const targetPages = b.targetPages || ['*'];
        if (!targetPages.includes('*') && !targetPages.includes(currentPage)) {
          // Verificar si algún patrón coincide
          const matches = targetPages.some((pattern: string) => {
            if (pattern.endsWith('*')) {
              return currentPage.startsWith(pattern.slice(0, -1));
            }
            return pattern === currentPage;
          });
          if (!matches) return false;
        }
        
        return true;
      })
      .map((b: any): PublicBanner => ({
        id: b.id,
        type: b.type,
        message: b.message,
        link: b.link,
        linkText: b.linkText,
        dismissible: b.dismissible,
        bgColor: b.bgColor,
        textColor: b.textColor,
      }));
    
    const combinedBanners = [...systemBanners, ...activeBanners];

    return new Response(JSON.stringify(combinedBanners), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache 1 minuto
      }
    });
  } catch (error) {
    console.error('Error GET /api/banners:', error);
    return new Response(JSON.stringify(systemBanners), { status: 200 });
  }
};
