// Test Layer 2: Repository Layer
// Objetivo: Verificar que el repositorio puede interactuar con Prisma

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AsesoriaRepository } from '../src/server/lib/features/asesoria/Asesoria.repository';
import { PrismaClient, ServiceType, AppointmentStatus } from '@prisma/client';

describe('Layer 2: Repository', () => {
  let repo: AsesoriaRepository;
  let prisma: PrismaClient;

  beforeAll(() => {
    repo = new AsesoriaRepository();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should instantiate repository without errors', () => {
    expect(repo).toBeDefined();
    expect(repo.agendarCita).toBeDefined();
    expect(repo.getCitasUsuario).toBeDefined();
  });

  it('should be able to query appointments', async () => {
    const testUserId = 'test-user-id';
    const result = await repo.getCitasUsuario(testUserId);
    expect(Array.isArray(result)).toBe(true);
  });
});
