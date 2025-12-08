// Test Layer 1: Prisma Client Connection
// Objetivo: Verificar que Prisma Client puede conectarse y hacer queries básicas

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/server/db/prisma-singleton';

describe('Layer 1: Prisma Client', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have prisma instance defined', () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.appointment).toBeDefined();
  });

  it('should be able to query empty users table', async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
  });
});
