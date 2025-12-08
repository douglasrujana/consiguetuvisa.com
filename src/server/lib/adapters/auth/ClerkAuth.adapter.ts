// src/server/lib/adapters/auth/ClerkAuth.adapter.ts

/**
 * ADAPTADOR DE CLERK
 * Implementación del puerto IAuthProvider usando Clerk.
 * Si mañana cambias a Supabase, solo creas SupabaseAuth.adapter.ts
 * y cambias la inyección en ContextFactory.
 */

import type { IAuthProvider } from '../../features/auth/Auth.port';
import type { AuthUser, AuthSession, TokenValidationResult } from '../../features/auth/Auth.entity';

// Clerk server-side utilities
import { clerkClient } from '@clerk/astro/server';

/**
 * Mapea un usuario de Clerk a nuestra entidad AuthUser pura.
 */
function mapClerkUserToAuthUser(clerkUser: any): AuthUser {
  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress ?? '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
    imageUrl: clerkUser.imageUrl,
    emailVerified: clerkUser.emailAddresses?.[0]?.verification?.status === 'verified',
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : undefined,
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : undefined,
    metadata: clerkUser.publicMetadata ?? {},
  };
}

export class ClerkAuthAdapter implements IAuthProvider {
  
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Clerk verifica el token JWT
      const client = await clerkClient();
      const decoded = await client.verifyToken(token);
      
      if (!decoded.sub) {
        return { isValid: false, error: 'Token inválido' };
      }

      const clerkUser = await client.users.getUser(decoded.sub);
      const user = mapClerkUserToAuthUser(clerkUser);

      return {
        isValid: true,
        user,
        session: {
          id: decoded.sid ?? '',
          userId: user.id,
          status: 'active',
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Error validando token',
      };
    }
  }

  async getUserFromRequest(request: Request): Promise<AuthUser | null> {
    try {
      // Extraer token del header Authorization
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      const result = await this.validateToken(token);
      
      return result.isValid ? result.user ?? null : null;
    } catch {
      return null;
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      return mapClerkUserToAuthUser(clerkUser);
    } catch {
      return null;
    }
  }

  async signOut(sessionId: string): Promise<boolean> {
    try {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
      return true;
    } catch {
      return false;
    }
  }

  async isAuthenticated(request: Request): Promise<boolean> {
    const user = await this.getUserFromRequest(request);
    return user !== null;
  }
}
