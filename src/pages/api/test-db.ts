// src/pages/api/test-db.ts
// Endpoint de prueba para verificar conexión a Turso

import type { APIRoute } from 'astro';
import { prisma } from '@db/prisma-singleton';

export const GET: APIRoute = async () => {
  try {
    // Intentar contar usuarios
    const count = await prisma.user.count();
    
    // Listar usuarios
    const users = await prisma.user.findMany({ take: 5 });

    return new Response(
      JSON.stringify({
        success: true,
        database: process.env.DATABASE_URL?.substring(0, 50) + '...',
        userCount: count,
        users: users.map(u => ({ id: u.id, email: u.email, role: u.role })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Test DB] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
