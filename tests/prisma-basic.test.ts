// Test simple: Verificar que Prisma Client funciona
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Prisma Client Basic Test', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  it('should instantiate PrismaClient', () => {
    expect(prisma).toBeDefined();
  });

  it('should have TestEntity model', () => {
    expect(prisma.testEntity).toBeDefined();
  });
});
