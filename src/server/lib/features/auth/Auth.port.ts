// src/server/lib/features/auth/Auth.port.ts

/**
 * PUERTO DE AUTENTICACIÓN
 * Define el contrato que DEBE cumplir cualquier proveedor de auth.
 * Esta interfaz es la ÚNICA que el Servicio/Caso de Uso conoce.
 * NO debe importar NADA de Clerk, Supabase, Firebase, etc.
 */

import type { AuthUser, AuthSession, TokenValidationResult } from './Auth.entity';

/**
 * Contrato para proveedores de autenticación.
 * Clerk, Supabase, Firebase, Auth0 - todos deben implementar esto.
 */
export interface IAuthProvider {
  /**
   * Valida un token de sesión y retorna el usuario.
   * @param token Token JWT o session token
   */
  validateToken(token: string): Promise<TokenValidationResult>;

  /**
   * Obtiene el usuario actual desde una request.
   * @param request Request HTTP de Astro
   */
  getUserFromRequest(request: Request): Promise<AuthUser | null>;

  /**
   * Obtiene un usuario por su ID.
   * @param userId ID del usuario
   */
  getUserById(userId: string): Promise<AuthUser | null>;

  /**
   * Cierra la sesión del usuario.
   * @param sessionId ID de la sesión a cerrar
   */
  signOut(sessionId: string): Promise<boolean>;

  /**
   * Verifica si una request está autenticada.
   * @param request Request HTTP
   */
  isAuthenticated(request: Request): Promise<boolean>;
}

/**
 * Contrato para repositorio de usuarios locales.
 * Sincroniza usuarios del proveedor externo con nuestra DB.
 */
export interface IUserRepository {
  /**
   * Busca o crea un usuario local basado en el auth externo.
   */
  findOrCreateFromAuth(authUser: AuthUser): Promise<AuthUser>;

  /**
   * Actualiza datos del usuario local.
   */
  updateFromAuth(authUser: AuthUser): Promise<AuthUser>;

  /**
   * Busca usuario por ID externo (Clerk ID, Supabase ID, etc.)
   */
  findByExternalId(externalId: string): Promise<AuthUser | null>;
}
