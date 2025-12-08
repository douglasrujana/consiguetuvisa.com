// src/server/lib/features/auth/index.ts
// Barrel export - API pública de la feature Auth

export { AuthService } from './Auth.service';
export type { IAuthProvider, IUserRepository } from './Auth.port';
export type { AuthUser, AuthSession, TokenValidationResult } from './Auth.entity';
