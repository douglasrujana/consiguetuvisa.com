// src/server/lib/features/user/User.entity.ts
// Entidad de dominio - representa un usuario en el sistema

import type { UserRole } from './User.dto';

export interface User {
  id: string;
  externalId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createUser(data: {
  id: string;
  externalId: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): User {
  return {
    id: data.id,
    externalId: data.externalId,
    email: data.email,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    phone: data.phone ?? null,
    role: data.role ?? 'USER',
    isActive: data.isActive ?? true,
    emailVerified: data.emailVerified ?? false,
    createdAt: data.createdAt ?? new Date(),
    updatedAt: data.updatedAt ?? new Date(),
  };
}
