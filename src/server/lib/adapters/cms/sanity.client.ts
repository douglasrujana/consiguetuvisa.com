// src/server/lib/adapters/cms/sanity.client.ts

/**
 * SANITY CMS CLIENT - Singleton
 * Conexión compartida al CMS. Los repositories de cada feature
 * usan este cliente para sus queries específicas.
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

// Configuración de Sanity
const config = {
  projectId: getEnv('SANITY_PROJECT_ID'),
  dataset: getEnv('SANITY_DATASET', 'production'),
  apiVersion: '2024-01-01',
  token: getEnv('SANITY_API_TOKEN'),
  useCdn: getEnv('NODE_ENV') === 'production',
};

// Validación
if (!config.projectId) {
  console.warn('[Sanity] SANITY_PROJECT_ID no configurado. El CMS no funcionará.');
}

// Cliente singleton
let _client: SanityClient | null = null;

export function getSanityClient(): SanityClient {
  if (!_client) {
    _client = createClient(config);
  }
  return _client;
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

// Export del cliente para uso directo
export const sanityClient = getSanityClient();
