// src/middleware.ts
// SOLO autenticación y autorización - NO registra usuarios

import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/solicitudes(.*)',
  '/api/admin(.*)',
]);

// Rutas que requieren rol ADMIN (excepto /api/admin/setup)
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin/solicitudes(.*)']);

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  const { userId } = auth();

  // 1. AUTENTICACIÓN: Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedRoute(context.request) && !userId) {
    return context.redirect('/login');
  }

  // 2. AUTORIZACIÓN: Si es ruta admin, verificar rol
  if (userId && isAdminRoute(context.request)) {
    try {
      const { getServices } = await import('@core/di/ContextFactory');
      const { userService } = getServices();

      const isAdmin = await userService.isAdmin(userId);

      if (!isAdmin) {
        console.log('[Middleware] Access denied to admin route:', userId);

        if (context.request.url.includes('/api/')) {
          return new Response(
            JSON.stringify({ error: 'Acceso denegado. Se requiere rol ADMIN.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return context.redirect('/dashboard?error=admin_required');
      }
    } catch (error) {
      console.error('[Middleware] Error checking admin role:', error);
    }
  }

  return next();
});
