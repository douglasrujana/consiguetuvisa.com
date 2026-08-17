// src/server/lib/adapters/cms/sanity.client.ts

/**
 * SANITY CMS CLIENT - Con soporte para Preview y Publicación
 */

import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Helper para obtener variables de entorno
function getEnv(key: string, defaultValue = ''): string {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
}

// Configuración base
export const sanityConfig = {
  projectId: getEnv('SANITY_PROJECT_ID', 'zvbggttz'),
  dataset: getEnv('SANITY_DATASET', 'production'),
  apiVersion: '2024-01-01',
  token: getEnv('SANITY_API_TOKEN'),
};

// Validación
if (!sanityConfig.projectId) {
  console.warn('[Sanity] SANITY_PROJECT_ID no configurado.');
}

// Cliente para contenido publicado (usa CDN en producción)
let _client: SanityClient | null = null;

export function getSanityClient(): SanityClient {
  if (!_client) {
    _client = createClient({
      ...sanityConfig,
      useCdn: getEnv('NODE_ENV') === 'production',
    });
  }
  return _client;
}

// Cliente para preview (sin CDN, con token para drafts)
let _previewClient: SanityClient | null = null;

export function getPreviewClient(): SanityClient {
  if (!_previewClient) {
    _previewClient = createClient({
      ...sanityConfig,
      useCdn: false,
      token: sanityConfig.token,
      perspective: 'previewDrafts', // Ver drafts no publicados
    });
  }
  return _previewClient;
}

// Cliente con permisos de escritura (para publicar)
let _writeClient: SanityClient | null = null;

export function getWriteClient(): SanityClient {
  if (!_writeClient) {
    if (!sanityConfig.token) {
      throw new Error('[Sanity] SANITY_API_TOKEN requerido para operaciones de escritura');
    }
    _writeClient = createClient({
      ...sanityConfig,
      useCdn: false,
      token: sanityConfig.token,
    });
  }
  return _writeClient;
}

// Image URL builder
let _imageBuilder: ReturnType<typeof imageUrlBuilder> | null = null;

function getImageBuilder() {
  if (!_imageBuilder) {
    _imageBuilder = imageUrlBuilder(getSanityClient());
  }
  return _imageBuilder;
}

/**
 * Genera URL optimizada para imágenes de Sanity
 */
export function urlFor(source: SanityImageSource) {
  return getImageBuilder().image(source);
}

/**
 * Helper para queries con soporte de preview.
 * Blindado con try/catch: nunca propaga errores hacia afuera.
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: { preview?: boolean } = {}
): Promise<T | null> {
  try {
    const client = options.preview ? getPreviewClient() : getSanityClient();
    return await client.fetch<T>(query, params);
  } catch (error) {
    console.warn('[Sanity] Error en sanityFetch:', (error as Error).message);
    return null;
  }
}

/**
 * FUNCIÓN CENTRAL DE FALLBACK - DRY, SOLID (Single Responsibility)
 *
 * Encapsula el patrón try/catch + fallback en un solo lugar.
 * Todos los servicios usan esta función en lugar de repetir lógica.
 *
 * @param query  - GROQ query de Sanity
 * @param fallback - Datos estáticos de respaldo
 * @param validator - Función opcional para validar que los datos son útiles
 * @param params - Parámetros opcionales para la query
 */
export async function withSanityFallback<T>(
  query: string,
  fallback: T,
  validator?: (data: T) => boolean,
  params: Record<string, unknown> = {}
): Promise<T> {
  try {
    const data = await sanityFetch<T>(query, params);

    if (data === null || data === undefined) {
      return fallback;
    }

    // Si hay validador, úsalo; si no, cualquier dato no-nulo es válido
    const isValid = validator ? validator(data) : true;
    if (!isValid) {
      console.warn('[Sanity] Datos inválidos o vacíos, usando fallback.');
      return fallback;
    }

    return data;
  } catch {
    console.warn('[Sanity] Error inesperado, usando fallback.');
    return fallback;
  }
}

// Export del cliente para uso directo
export const sanityClient = getSanityClient();

