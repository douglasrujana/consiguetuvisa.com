// Endpoint de prueba mínimo - solo para verificar que Astro routing funciona
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  console.log('[TEST] GET /api/test called');
  return new Response(JSON.stringify({ message: 'Hola Mundo desde Astro!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  console.log('[TEST] POST /api/test called');
  const body = await request.json();
  console.log('[TEST] Body received:', body);
  
  return new Response(JSON.stringify({ 
    message: 'Hola Mundo POST!',
    received: body 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
