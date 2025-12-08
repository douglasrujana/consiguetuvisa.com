export const prerender = false;

import { prisma } from '../../server/db/prisma-singleton';

export async function GET() {
  try {
    console.log('API: Attempting to connect to DB...');
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('API: Connection successful!');

    // Get basic info
    const url = process.env.DATABASE_URL;
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      message: 'Prisma Connected Successfully (Binary Engine)',
      env_db_url: url ? 'Defined' : 'Missing',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('API: Prisma Error:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
