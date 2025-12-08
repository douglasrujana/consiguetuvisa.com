// src/server/lib/features/auth/Auth.service.ts

/**
 * SERVICIO DE AUTENTICACIÓN
 * Lógica de negocio de auth. NO conoce Clerk ni Supabase.
 * Solo trabaja con el puerto IAuthProvider.
 */

import type { IAuthProvider } from './Auth.port';
import type { AuthUser, TokenValidationResult } from './Auth.entity';
import { AuthenticationError } from '../../core/error/Domain.error';

export class AuthService {
  constructor(private readonly authProvider: IAuthProvider) {}

  /**
   * Obtiene el usuario autenticado de una request.
   * @throws AuthenticationError si no hay usuario autenticado
   */
  async getAuthenticatedUser(request: Request): Promise<AuthUser> {
    const user = await this.authProvider.getUserFromRequest(request);
    
    if (!user) {
      throw new AuthenticationError('No hay sesión activa. Por favor inicia sesión.');
    }
    
    return user;
  }

  /**
   * Obtiene el usuario si existe, null si no está autenticado.
   * No lanza error - útil para rutas públicas con contenido condicional.
   */
  async getOptionalUser(request: Request): Promise<AuthUser | null> {
    return this.authProvider.getUserFromRequest(request);
  }

  /**
   * Verifica si la request está autenticada.
   */
  async isAuthenticated(request: Request): Promise<boolean> {
    return this.authProvider.isAuthenticated(request);
  }

  /**
   * Valida un token y retorna el resultado.
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    return this.authProvider.validateToken(token);
  }

  /**
   * Cierra la sesión.
   */
  async signOut(sessionId: string): Promise<boolean> {
    return this.authProvider.signOut(sessionId);
  }

  /**
   * Obtiene usuario por ID.
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    return this.authProvider.getUserById(userId);
  }
}
