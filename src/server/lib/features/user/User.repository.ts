// src/server/lib/features/user/User.repository.ts
// Implementación del repositorio - acceso a datos

import { prisma } from '@db/prisma-singleton';
import type { User, UserRole } from './User.entity';
import type { IUserRepository } from './User.port';
import type { CreateUserFromClerkDTO, UpdateUserDTO } from './User.dto';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user as User | null;
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { externalId } });
    return user as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user as User | null;
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users as User[];
  }

  async create(data: CreateUserFromClerkDTO): Promise<User> {
    const user = await prisma.user.create({
      data: {
        externalId: data.externalId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerified: data.emailVerified ?? false,
        role: 'USER',
        isActive: true,
      },
    });
    return user as User;
  }

  async update(externalId: string, data: UpdateUserDTO): Promise<User> {
    const user = await prisma.user.update({
      where: { externalId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
      },
    });
    return user as User;
  }

  async setRole(externalId: string, role: UserRole): Promise<User> {
    const user = await prisma.user.update({
      where: { externalId },
      data: { role },
    });
    return user as User;
  }

  async deactivate(externalId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { externalId },
      data: { isActive: false },
    });
    return user as User;
  }
}
