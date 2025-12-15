// src/middleware.ts
// Autenticación y autorización con separación Customer/StaffMember

import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/astro/server';
import { prisma } from './server/db/prisma-singleton';

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/social(.*)',
  '/api/solicitudes(.*)',
  '/api/admin(.*)',
]);

// Rutas que requieren rol ADMIN
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

// Rutas que requieren rol COMMUNITY o ADMIN
const isSocialRoute = createRouteMatcher(['/social(.*)', '/api/social(.*)']);

// Roles permitidos por tipo de ruta
const ADMIN_ROLES = ['ADMIN', 'DEV'];
const SOCIAL_ROLES = ['ADMIN', 'COMMUNITY'];
const STAFF_ROLES = ['ADMIN', 'DEV', 'SALES', 'COMMUNITY', 'SUPPORT'];

// Cache en memoria para usuarios (TTL: 5 minutos)
const userCache = new Map<string, { data: AuthUser; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userType: 'staff' | 'customer';
  role?: string; // Solo para staff
}

function getCachedUser(clerkId: string): AuthUser | null {
  const cached = userCache.get(clerkId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedUser(clerkId: string, user: AuthUser) {
  userCache.set(clerkId, { data: user, timestamp: Date.now() });
}

async function findUserByClerkId(clerkId: string, clerkEmail?: string): Promise<AuthUser | null> {
  // 1. Buscar primero en StaffMember por clerkId
  let staff = await prisma.staffMember.findUnique({
    where: { clerkId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true }
  });
  
  // 1b. Si no encontró por clerkId pero tenemos email, buscar por email y vincular
  if (!staff && clerkEmail) {
    staff = await prisma.staffMember.findUnique({
      where: { email: clerkEmail },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true }
    });
    
    // Vincular el clerkId para futuras búsquedas
    if (staff) {
      await prisma.staffMember.update({
        where: { email: clerkEmail },
        data: { clerkId }
      }).catch(() => {}); // Ignorar errores de unique constraint
    }
  }
  
  if (staff && staff.isActive) {
    return {
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      userType: 'staff',
      role: staff.role
    };
  }
  
  // 2. Buscar en Customer por clerkId
  let customer = await prisma.customer.findUnique({
    where: { clerkId },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true }
  });
  
  // 2b. Si no encontró por clerkId pero tenemos email, buscar por email y vincular
  if (!customer && clerkEmail) {
    customer = await prisma.customer.findUnique({
      where: { email: clerkEmail },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true }
    });
    
    // Vincular el clerkId para futuras búsquedas
    if (customer) {
      await prisma.customer.update({
        where: { email: clerkEmail },
        data: { clerkId }
      }).catch(() => {}); // Ignorar errores de unique constraint
    }
  }
  
  if (customer && customer.isActive) {
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      userType: 'customer'
    };
  }
  
  return null;
}

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  const authData = auth();
  const clerkId = authData.userId;

  // 1. AUTENTICACIÓN: Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedRoute(context.request) && !clerkId) {
    return context.redirect('/login');
  }

  // 2. Cargar usuario local si está autenticado
  if (clerkId) {
    try {
      // Intentar obtener del cache primero
      let user = getCachedUser(clerkId);
      
      if (!user) {
        // Primero intentar buscar solo por clerkId (rápido)
        user = await findUserByClerkId(clerkId);
        
        // Si no encontró, obtener email de Clerk y buscar por email
        if (!user) {
          const sessionClaims = authData.sessionClaims as any;
          let clerkEmail = sessionClaims?.email 
            || sessionClaims?.primary_email_address
            || sessionClaims?.emailAddresses?.[0]?.emailAddress;

          // Solo llamar a la API de Clerk si no tenemos email en claims
          if (!clerkEmail) {
            try {
              const client = await clerkClient();
              const clerkUser = await client.users.getUser(clerkId);
              clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
            } catch (e) {
              console.error('[Middleware] Error getting Clerk user:', e);
            }
          }
          
          // Buscar por email si lo tenemos
          if (clerkEmail) {
            user = await findUserByClerkId(clerkId, clerkEmail);
          }
        }
        
        if (user) {
          setCachedUser(clerkId, user);
        }
      }
      
      // Guardar en locals para que las páginas puedan acceder
      const locals = context.locals as any;
      locals.authUser = user;
      locals.userType = user?.userType;
      
      // Compatibilidad temporal con código existente
      if (user?.userType === 'staff') {
        locals.localUser = { ...user, role: user.role };
        locals.staff = user;
      } else if (user?.userType === 'customer') {
        locals.customer = user;
      }
      
      // 3. AUTORIZACIÓN: Verificar permisos según ruta
      
      // Rutas admin: solo ADMIN y DEV
      if (isAdminRoute(context.request)) {
        const hasAccess = user?.userType === 'staff' && ADMIN_ROLES.includes(user.role || '');
        
        if (!hasAccess) {
          if (context.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ error: 'Acceso denegado. Se requiere rol ADMIN.' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return context.redirect('/dashboard?error=admin_required');
        }
      }
      
      // Rutas social: solo ADMIN y COMMUNITY
      if (isSocialRoute(context.request)) {
        const hasAccess = user?.userType === 'staff' && SOCIAL_ROLES.includes(user.role || '');
        
        if (!hasAccess) {
          if (context.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ error: 'Acceso denegado. Se requiere rol COMMUNITY.' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return context.redirect('/dashboard?error=community_required');
        }
      }
      
    } catch (error) {
      console.error('[Middleware] Error loading user:', error);
    }
  }

  return next();
});
