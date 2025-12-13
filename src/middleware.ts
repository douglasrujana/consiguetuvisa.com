// src/middleware.ts
// SOLO autenticación y autorización - NO registra usuarios

import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';
import { getBasicServices } from './server/lib/core/di/ContextFactory';

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/solicitudes(.*)',
  '/api/admin(.*)',
]);

// Rutas que requieren rol ADMIN
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin/solicitudes(.*)', '/api/admin/users(.*)']);

// Cache en memoria para usuarios (TTL: 5 minutos)
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  return null;
}

function setCachedUser(userId: string, user: any) {
  userCache.set(userId, { user, timestamp: Date.now() });
}

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  const { userId } = auth();

  // 1. AUTENTICACIÓN: Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedRoute(context.request) && !userId) {
    return context.redirect('/login');
  }

  // 2. Cargar usuario local si está autenticado
  if (userId) {
    try {
      // Intentar obtener del cache primero
      let user = getCachedUser(userId);
      
      if (!user) {
        // Usar servicio (Clean Architecture)
        const { userService } = getBasicServices();
        user = await userService.getByExternalId(userId);
        
        if (user) {
          setCachedUser(userId, user);
        }
      }
      
      // Guardar en locals para que las páginas puedan acceder
      (context.locals as any).localUser = user;
      
      // 3. AUTORIZACIÓN: Si es ruta admin, verificar rol
      if (isAdminRoute(context.request)) {
        const isAdmin = user?.role === 'ADMIN';

        if (!isAdmin) {
          if (context.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ error: 'Acceso denegado. Se requiere rol ADMIN.' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return context.redirect('/dashboard?error=admin_required');
        }
      }
    } catch (error) {
      console.error('[Middleware] Error loading user:', error);
    }
  }

  return next();
});
