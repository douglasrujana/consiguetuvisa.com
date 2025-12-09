// src/server/db/prisma-singleton.ts
// Singleton de Prisma Client para Prisma 7 con Turso/LibSQL

// PrismaClient: CommonJS module, needs default import
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// PrismaLibSql: ESM module, named export works
import { PrismaLibSql } from '@prisma/adapter-libsql';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Helper para obtener variables de entorno
function getEnv(key: string, defaultValue = ''): string {
  // Primero process.env (Node.js)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  // Luego import.meta.env (Vite/Astro)
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
}

function createPrismaClient() {
  const dbUrl = getEnv('DATABASE_URL', 'file:./dev.db');
  const authToken = getEnv('TURSO_AUTH_TOKEN');

  console.log('[Prisma] Connecting to:', dbUrl.substring(0, 50) + '...');

  // Configuración para Turso (remoto) o SQLite local
  const config = dbUrl.startsWith('libsql://')
    ? { url: dbUrl, authToken }
    : { url: dbUrl };

  const adapter = new PrismaLibSql(config);

  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
