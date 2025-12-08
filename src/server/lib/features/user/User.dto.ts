// src/server/lib/features/user/User.dto.ts
// DTOs con validación Zod - validan en la capa de entrada

import { z } from 'zod';

// Schema para roles
export const UserRoleSchema = z.enum(['USER', 'ADMIN', 'AGENT']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// DTO para crear usuario desde Clerk
export const CreateUserFromClerkSchema = z.object({
  externalId: z.string().min(1, 'externalId es requerido'),
  email: z.string().email('Email inválido'),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  emailVerified: z.boolean().optional().default(false),
});
export type CreateUserFromClerkDTO = z.infer<typeof CreateUserFromClerkSchema>;

// DTO para actualizar usuario
export const UpdateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  phone: z.string().nullish(),
  emailVerified: z.boolean().optional(),
});
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;

// DTO para cambiar rol
export const ChangeRoleSchema = z.object({
  externalId: z.string().min(1, 'externalId es requerido'),
  role: UserRoleSchema,
});
export type ChangeRoleDTO = z.infer<typeof ChangeRoleSchema>;

// DTO de respuesta pública
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: UserRoleSchema,
  isActive: z.boolean(),
});
export type UserResponseDTO = z.infer<typeof UserResponseSchema>;

// Funciones de validación para usar en la capa de entrada (API)
export function validateCreateUserFromClerk(data: unknown): CreateUserFromClerkDTO {
  return CreateUserFromClerkSchema.parse(data);
}

export function validateUpdateUser(data: unknown): UpdateUserDTO {
  return UpdateUserSchema.parse(data);
}

export function validateChangeRole(data: unknown): ChangeRoleDTO {
  return ChangeRoleSchema.parse(data);
}

export function validateExternalId(id: unknown): string {
  return z.string().min(1, 'externalId es requerido').parse(id);
}

export function validateEmail(email: unknown): string {
  return z.string().email('Email inválido').parse(email);
}
