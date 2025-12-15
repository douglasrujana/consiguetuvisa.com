// src/lib/sanity/cache.ts
/**
 * ============================================================================
 * STALE-WHILE-REVALIDATE (SWR) CACHE PARA SANITY CMS
 * ============================================================================
 * 
 * PROBLEMA:
 * - Las llamadas a Sanity CMS pueden tardar 2-5 segundos cada una
 * - El homepage hace ~10 llamadas = 20-50 segundos de carga
 * - Esto es inaceptable para UX
 * 
 * SOLUCIÓN: Patrón Stale-While-Revalidate (SWR)
 * 
 * ¿CÓMO FUNCIONA?
 * 1. Primera visita: Carga desde Sanity (lento, ~5s) y guarda en cache
 * 2. Visitas siguientes: Retorna cache INMEDIATAMENTE (~0ms)
 * 3. En background: Si el cache expiró, revalida con Sanity
 * 4. Próxima visita: Ya tiene datos frescos en cache
 * 
 * BENEFICIOS:
 * - Respuesta instantánea para usuarios (siempre hay datos en cache)
 * - Datos eventualmente consistentes (se actualizan en background)
 * - Los editores ven cambios en segundos (no minutos como ISR)
 * - Sin bloqueo de requests mientras se revalida
 * 
 * CONFIGURACIÓN:
 * - staleTime: 30 segundos (después de esto, revalida en background)
 * - maxAge: 5 minutos (después de esto, fuerza recarga)
 * 
 * COMPARACIÓN CON OTRAS SOLUCIONES:
 * ┌─────────────────┬──────────────┬──────────────┬──────────────┐
 * │ Solución        │ Velocidad    │ Frescura     │ Complejidad  │
 * ├─────────────────┼──────────────┼──────────────┼──────────────┤
 * │ Sin cache       │ ❌ 43s       │ ✅ Inmediata │ ✅ Ninguna   │
 * │ ISR (5 min)     │ ✅ <100ms    │ ❌ 5 min     │ ⚠️ Media     │
 * │ SWR (este)      │ ✅ <100ms    │ ✅ ~30s      │ ⚠️ Media     │
 * │ Redis/KV        │ ✅ <50ms     │ ✅ ~30s      │ ❌ Alta      │
 * └─────────────────┴──────────────┴──────────────┴──────────────┘
 * 
 * ============================================================================
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isRevalidating: boolean;
}

// Cache en memoria (persiste mientras el servidor esté corriendo)
const cache = new Map<string, CacheEntry<unknown>>();

// Configuración de tiempos (en milisegundos)
const CACHE_CONFIG = {
  // Tiempo antes de considerar datos "stale" y revalidar en background
  // 30 segundos = editores ven cambios rápido
  staleTime: 30 * 1000,
  
  // Tiempo máximo antes de forzar recarga (fallback de seguridad)
  // 5 minutos = nunca servir datos muy viejos
  maxAge: 5 * 60 * 1000,
};

/**
 * Wrapper SWR para cualquier función async
 * 
 * @param key - Identificador único del cache (ej: 'sanity:hero')
 * @param fetcher - Función que obtiene los datos frescos
 * @returns Datos del cache o frescos
 * 
 * @example
 * // En lugar de:
 * const hero = await getHeroFromSanity();
 * 
 * // Usar:
 * const hero = await withSWR('sanity:hero', getHeroFromSanity);
 */
export async function withSWR<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  // CASO 1: Cache existe y no ha expirado maxAge
  if (entry && (now - entry.timestamp) < CACHE_CONFIG.maxAge) {
    const isStale = (now - entry.timestamp) > CACHE_CONFIG.staleTime;
    
    // Si está stale y no está revalidando, revalidar en background
    if (isStale && !entry.isRevalidating) {
      // Marcar como revalidando para evitar múltiples revalidaciones
      entry.isRevalidating = true;
      
      // Revalidar en background (no bloquea la respuesta)
      revalidateInBackground(key, fetcher).catch(err => {
        console.error(`[SWR] Error revalidando ${key}:`, err);
        entry.isRevalidating = false;
      });
    }
    
    // Retornar datos del cache inmediatamente
    console.log(`[SWR] Cache HIT para ${key} (stale: ${isStale})`);
    return entry.data;
  }

  // CASO 2: Cache no existe o expiró maxAge - cargar datos frescos
  console.log(`[SWR] Cache MISS para ${key} - cargando desde origen...`);
  
  try {
    const data = await fetcher();
    
    // Guardar en cache
    cache.set(key, {
      data,
      timestamp: now,
      isRevalidating: false,
    });
    
    return data;
  } catch (error) {
    // Si hay error pero tenemos cache viejo, usarlo como fallback
    if (entry) {
      console.warn(`[SWR] Error cargando ${key}, usando cache viejo como fallback`);
      return entry.data;
    }
    throw error;
  }
}

/**
 * Revalida el cache en background sin bloquear
 */
async function revalidateInBackground<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<void> {
  console.log(`[SWR] Revalidando ${key} en background...`);
  
  const data = await fetcher();
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    isRevalidating: false,
  });
  
  console.log(`[SWR] ${key} revalidado exitosamente`);
}

/**
 * Invalida una entrada específica del cache
 * Útil para forzar recarga después de editar en Sanity
 * 
 * @example
 * // Después de publicar en Sanity, llamar webhook:
 * invalidateCache('sanity:hero');
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
  console.log(`[SWR] Cache invalidado: ${key}`);
}

/**
 * Invalida todo el cache de Sanity
 * Útil para webhook de "publicar todo"
 */
export function invalidateAllSanityCache(): void {
  const keysToDelete: string[] = [];
  
  cache.forEach((_, key) => {
    if (key.startsWith('sanity:')) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`[SWR] Cache de Sanity invalidado (${keysToDelete.length} entradas)`);
}

/**
 * Obtiene estadísticas del cache (para debugging/admin)
 */
export function getCacheStats(): {
  entries: number;
  keys: string[];
  oldestEntry: number | null;
} {
  const keys: string[] = [];
  let oldestTimestamp: number | null = null;
  
  cache.forEach((entry, key) => {
    keys.push(key);
    if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
  });
  
  return {
    entries: cache.size,
    keys,
    oldestEntry: oldestTimestamp ? Date.now() - oldestTimestamp : null,
  };
}
