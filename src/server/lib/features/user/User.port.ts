// src/server/lib/features/user/User.port.ts
// Puerto (interfaz) del repositorio - define el contrato

import type { User } from './User.entity';
import type { UserRole, CreateUserFromClerkDTO, UpdateUserDTO } from './User.dto';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByExternalId(externalId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserFromClerkDTO): Promise<User>;
  update(externalId: string, data: UpdateUserDTO): Promise<User>;
  setRole(externalId: string, role: UserRole): Promise<User>;
  deactivate(externalId: string): Promise<User>;
}
