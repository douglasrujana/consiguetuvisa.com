// src/server/lib/core/auth/jwt.ts

/**
 * UTILIDADES JWT
 * Helpers para trabajar con tokens.
 * Agnóstico al proveedor - solo utilidades genéricas.
 */

/**
 * Extrae el token Bearer de un header Authorization.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Decodifica un JWT sin verificar (solo para leer claims).
 * NO usar para autenticación - solo para debugging/logging.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado (sin verificar firma).
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  
  const expiration = (payload.exp as number) * 1000;
  return Date.now() >= expiration;
}
