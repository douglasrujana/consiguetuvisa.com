// src/server/lib/features/user/User.service.ts
// Servicio - lógica de negocio pura (recibe datos ya validados)

import type { User } from './User.entity';
import type { UserRole } from './User.dto';
import type { IUserRepository } from './User.port';
import type { CreateUserFromClerkDTO, UpdateUserDTO, UserResponseDTO } from './User.dto';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Sincroniza usuario desde Clerk (crea si no existe, actualiza si existe)
   * @param data - Datos YA VALIDADOS por el DTO
   */
  async syncFromClerk(data: CreateUserFromClerkDTO): Promise<User> {
    const existing = await this.userRepository.findByExternalId(data.externalId);

    if (existing) {
      const hasChanges =
        existing.email !== data.email ||
        existing.firstName !== data.firstName ||
        existing.lastName !== data.lastName;

      if (hasChanges) {
        return this.userRepository.update(data.externalId, {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          emailVerified: data.emailVerified,
        });
      }
      return existing;
    }

    return this.userRepository.create(data);
  }

  async getByExternalId(externalId: string): Promise<User | null> {
    return this.userRepository.findByExternalId(externalId);
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async isAdmin(externalId: string): Promise<boolean> {
    const user = await this.userRepository.findByExternalId(externalId);
    return user?.role === 'ADMIN';
  }


  async hasRole(externalId: string, role: UserRole): Promise<boolean> {
    const user = await this.userRepository.findByExternalId(externalId);
    if (!user) return false;

    if (role === 'USER') return true;
    if (role === 'AGENT') return user.role === 'AGENT' || user.role === 'ADMIN';
    if (role === 'ADMIN') return user.role === 'ADMIN';

    return false;
  }

  async promoteFirstAdmin(externalId: string): Promise<User | null> {
    const allUsers = await this.userRepository.findAll();
    const existingAdmin = allUsers.find(u => u.role === 'ADMIN');

    if (existingAdmin) return null;

    const user = await this.userRepository.findByExternalId(externalId);
    if (!user) return null;

    return this.userRepository.setRole(externalId, 'ADMIN');
  }

  async changeRole(externalId: string, newRole: UserRole): Promise<User> {
    return this.userRepository.setRole(externalId, newRole);
  }

  async deactivateUser(externalId: string): Promise<User> {
    return this.userRepository.deactivate(externalId);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Convierte entidad a DTO de respuesta
   */
  toResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      isActive: user.isActive,
    };
  }
}
