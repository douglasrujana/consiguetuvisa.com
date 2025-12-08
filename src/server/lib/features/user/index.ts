// src/server/lib/features/user/index.ts
// Barrel export - punto de entrada de la feature

// Entidad
export { type User, createUser } from './User.entity';

// DTOs, Schemas y funciones de validación
export {
  // Schemas
  CreateUserFromClerkSchema,
  UpdateUserSchema,
  ChangeRoleSchema,
  UserResponseSchema,
  UserRoleSchema,
  // Funciones de validación (usar en capa de entrada)
  validateCreateUserFromClerk,
  validateUpdateUser,
  validateChangeRole,
  validateExternalId,
  validateEmail,
} from './User.dto';

export type {
  CreateUserFromClerkDTO,
  UpdateUserDTO,
  ChangeRoleDTO,
  UserResponseDTO,
  UserRole,
} from './User.dto';

// Puerto (interfaz)
export type { IUserRepository } from './User.port';

// Implementación del repositorio
export { UserRepository } from './User.repository';

// Servicio (casos de uso)
export { UserService } from './User.service';
