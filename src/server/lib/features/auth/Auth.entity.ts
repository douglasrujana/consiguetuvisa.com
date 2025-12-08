// src/server/lib/features/auth/Auth.entity.ts

/**
 * ENTIDADES DE DOMINIO PURAS - AUTH
 * NO importan NADA de Clerk, Supabase, o cualquier proveedor.
 * Son la representación canónica del usuario autenticado en nuestro sistema.
 */

/**
 * Usuario autenticado en el sistema.
 * Esta entidad es agnóstica al proveedor de auth.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Sesión de usuario.
 */
export interface AuthSession {
  id: string;
  userId: string;
  status: 'active' | 'expired' | 'revoked';
  lastActiveAt?: Date;
  expiresAt?: Date;
}

/**
 * Resultado de validación de token.
 */
export interface TokenValidationResult {
  isValid: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
}
