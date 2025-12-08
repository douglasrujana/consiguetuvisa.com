// src/pages/api/auth/debug.ts
// Debug endpoint para ver qué datos tiene Clerk

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { auth } = locals;
    const authData = auth();

    return new Response(
      JSON.stringify({
        userId: authData.userId,
        sessionId: authData.sessionId,
        sessionClaims: authData.sessionClaims,
        hasAuth: !!authData.userId,
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
