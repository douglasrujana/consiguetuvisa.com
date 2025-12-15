// GET /api/health
// Health check endpoint con verificaciones REALES de servicios

import type { APIRoute } from 'astro';
import { prisma } from '@server/db/prisma-singleton';

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  provider?: string;
  details?: Record<string, any>;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: Record<string, ServiceStatus>;
  network: {
    externalLatency: number;
    dnsResolution: number;
    sanityLatency?: number;
    geminiLatency?: number;
  };
  metrics: {
    uptime: string;
    uptimeSeconds: number;
    memoryUsage: number;
    memoryTotal: number;
    conversationsToday: number;
    usersTotal: number;
    documentsTotal: number;
  };
}

// Cache para evitar llamadas excesivas (5 min)
let healthCache: { data: HealthResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos para checks profundos

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return { 
      status: latency < 100 ? 'up' : 'degraded', 
      latency,
      details: { type: 'sqlite/turso' }
    };
  } catch (e) {
    return { status: 'down', error: (e as Error).message, latency: Date.now() - start };
  }
}

async function checkAI(): Promise<ServiceStatus> {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) return { status: 'down', error: 'No API key configured', provider: 'gemini' };
  
  const start = Date.now();
  try {
    // Llamada real a Gemini (modelo más barato)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    );
    const latency = Date.now() - start;
    
    if (res.ok) {
      return { status: 'up', provider: 'gemini', latency, details: { model: 'gemini-2.5-flash-lite' } };
    }
    return { status: 'degraded', provider: 'gemini', latency, error: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'down', provider: 'gemini', error: (e as Error).message, latency: Date.now() - start };
  }
}

async function checkStorage(): Promise<ServiceStatus> {
  const provider = import.meta.env.STORAGE_PROVIDER || 'local';
  
  if (provider === 'local') {
    return { status: 'up', provider: 'local', details: { type: 'filesystem' } };
  }
  
  if (provider === 'vercel') {
    const token = import.meta.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return { status: 'down', provider: 'vercel', error: 'No token configured' };
    
    const start = Date.now();
    try {
      // Verificar Vercel Blob API
      const res = await fetch('https://blob.vercel-storage.com', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - start;
      return { status: res.ok ? 'up' : 'degraded', provider: 'vercel', latency };
    } catch (e) {
      return { status: 'down', provider: 'vercel', error: (e as Error).message };
    }
  }
  
  return { status: 'up', provider };
}

async function checkAuth(): Promise<ServiceStatus> {
  const secretKey = import.meta.env.CLERK_SECRET_KEY;
  if (!secretKey) return { status: 'down', provider: 'clerk', error: 'No secret key configured' };
  
  const start = Date.now();
  try {
    // Verificar Clerk API
    const res = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(5000)
    });
    const latency = Date.now() - start;
    return { status: res.ok ? 'up' : 'degraded', provider: 'clerk', latency };
  } catch (e) {
    return { status: 'down', provider: 'clerk', error: (e as Error).message, latency: Date.now() - start };
  }
}

async function checkCMS(): Promise<ServiceStatus> {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET || 'production';
  
  if (!projectId) return { status: 'down', provider: 'sanity', error: 'No project ID configured' };
  
  const start = Date.now();
  try {
    // Query simple a Sanity
    const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=*[_type=="siteSettings"][0]{_id}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - start;
    return { status: res.ok ? 'up' : 'degraded', provider: 'sanity', latency };
  } catch (e) {
    return { status: 'down', provider: 'sanity', error: (e as Error).message, latency: Date.now() - start };
  }
}

async function checkNetwork(): Promise<HealthResponse['network']> {
  const results: HealthResponse['network'] = {
    externalLatency: 0,
    dnsResolution: 0
  };
  
  // Test DNS + latencia externa (Google DNS)
  const dnsStart = Date.now();
  try {
    await fetch('https://dns.google/resolve?name=google.com&type=A', { 
      signal: AbortSignal.timeout(3000) 
    });
    results.dnsResolution = Date.now() - dnsStart;
  } catch { results.dnsResolution = -1; }
  
  // Test latencia externa general
  const extStart = Date.now();
  try {
    await fetch('https://www.google.com/generate_204', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(3000) 
    });
    results.externalLatency = Date.now() - extStart;
  } catch { results.externalLatency = -1; }
  
  return results;
}

async function getMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [conversationsToday, customersTotal, staffTotal, documentsTotal] = await Promise.all([
      prisma.conversation.count({ where: { createdAt: { gte: today } } }),
      prisma.customer.count(),
      prisma.staffMember.count(),
      prisma.kBDocument.count()
    ]);

    const uptimeSeconds = process.uptime ? process.uptime() : 0;
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      uptime: `${hours}h ${minutes}m`,
      uptimeSeconds: Math.floor(uptimeSeconds),
      memoryUsage: process.memoryUsage ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) : 0,
      memoryTotal: process.memoryUsage ? Math.round(process.memoryUsage().heapTotal / 1024 / 1024) : 0,
      conversationsToday,
      customersTotal,
      staffTotal,
      usersTotal: customersTotal + staffTotal, // Compatibilidad
      documentsTotal
    };
  } catch {
    return {
      uptime: 'N/A',
      uptimeSeconds: 0,
      memoryUsage: 0,
      memoryTotal: 0,
      conversationsToday: 0,
      usersTotal: 0,
      documentsTotal: 0
    };
  }
}

export const GET: APIRoute = async ({ url }) => {
  // Parámetro para forzar refresh
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  
  // Usar cache si está disponible y no se fuerza refresh
  if (!forceRefresh && healthCache && Date.now() - healthCache.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify({ ...healthCache.data, cached: true }), {
      status: healthCache.data.status === 'healthy' ? 200 : 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Ejecutar todos los checks en paralelo
  const [database, ai, storage, auth, cms, network, metrics] = await Promise.all([
    checkDatabase(),
    checkAI(),
    checkStorage(),
    checkAuth(),
    checkCMS(),
    checkNetwork(),
    getMetrics()
  ]);

  const services = { database, ai, storage, auth, cms };
  
  // Agregar latencias de servicios al network
  if (ai.latency) network.geminiLatency = ai.latency;
  if (cms.latency) network.sanityLatency = cms.latency;
  
  // Determinar estado general
  const statuses = Object.values(services).map(s => s.status);
  const downCount = statuses.filter(s => s === 'down').length;
  const degradedCount = statuses.filter(s => s === 'degraded').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (downCount >= 2 || services.database.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (downCount > 0 || degradedCount > 0) {
    overallStatus = 'degraded';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
    services,
    network,
    metrics
  };

  // Guardar en cache
  healthCache = { data: response, timestamp: Date.now() };

  return new Response(JSON.stringify(response), {
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
