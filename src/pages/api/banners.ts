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
    // Obtener la página actual del header o query param
    const url = new URL(request.url);
    const currentPage = url.searchParams.get('page') || '/';
    
    // Obtener banners de la BD
    const bannersConfig = await prisma.systemConfig.findUnique({
      where: { key: 'banners' }
    });
    
    if (!bannersConfig?.value) {
      return new Response(JSON.stringify([]), {
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
    
    return new Response(JSON.stringify(activeBanners), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache 1 minuto
      }
    });
  } catch (error) {
    console.error('Error GET /api/banners:', error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
};
