// src/server/lib/core/auth/middleware.ts

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * Utilidades para proteger rutas y endpoints.
 */

import { buildContext } from '../di/ContextFactory';
import type { AuthUser } from '../../features/auth/Auth.entity';
import { AuthenticationError } from '../error/Domain.error';

/**
 * Resultado de verificación de auth.
 */
export interface AuthResult {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

/**
 * Verifica si una request está autenticada.
 * No lanza error, retorna el resultado.
 */
export async function checkAuth(request: Request): Promise<AuthResult> {
  const context = buildContext(request);
  
  try {
    const user = await context.authService.getOptionalUser(request);
    return {
      isAuthenticated: user !== null,
      user,
    };
  } catch {
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}

/**
 * Requiere autenticación. Lanza error si no está autenticado.
 * Usar en endpoints protegidos.
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const context = buildContext(request);
  return context.authService.getAuthenticatedUser(request);
}

/**
 * Helper para crear respuesta de error de auth.
 */
export function unauthorizedResponse(message = 'No autorizado'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Helper para crear respuesta de error forbidden.
 */
export function forbiddenResponse(message = 'Acceso denegado'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
