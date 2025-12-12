// src/server/lib/features/knowledge/Source.entity.ts

/**
 * ENTIDADES DE SOURCE (Fuentes de Datos)
 * Modelos de dominio para gestión de fuentes de conocimiento.
 */

/**
 * Tipos de fuentes de datos soportadas
 */
export enum SourceType {
  BLOB = 'BLOB',
  SANITY = 'SANITY',
  WEB = 'WEB',
  SOCIAL = 'SOCIAL',
  RSS = 'RSS',
  MANUAL = 'MANUAL',
}

/**
 * Configuración para fuente tipo BLOB (Vercel Blob, R2, etc.)
 */
export interface BlobSourceConfig {
  type: 'BLOB';
  bucket: string;
  prefix?: string;
}

/**
 * Configuración para fuente tipo SANITY CMS
 */
export interface SanitySourceConfig {
  type: 'SANITY';
  dataset: string;
  query: string;
}

/**
 * Configuración para fuente tipo WEB (scraping)
 */
export interface WebSourceConfig {
  type: 'WEB';
  urls: string[];
  selector?: string;
  schedule: string;
}

/**
 * Plataformas sociales soportadas
 */
export type SocialPlatform = 'twitter' | 'facebook' | 'instagram';

/**
 * Configuración para fuente tipo SOCIAL
 */
export interface SocialSourceConfig {
  type: 'SOCIAL';
  platform: SocialPlatform;
  accounts: string[];
  schedule: string;
}

/**
 * Configuración para fuente tipo RSS
 */
export interface RSSSourceConfig {
  type: 'RSS';
  feedUrls: string[];
  schedule: string;
}

/**
 * Configuración para fuente tipo MANUAL
 */
export interface ManualSourceConfig {
  type: 'MANUAL';
}

/**
 * Union type de todas las configuraciones de fuente
 */
export type SourceConfig =
  | BlobSourceConfig
  | SanitySourceConfig
  | WebSourceConfig
  | SocialSourceConfig
  | RSSSourceConfig
  | ManualSourceConfig;

/**
 * Entidad Source - Fuente de datos para el knowledge base
 */
export interface Source {
  id: string;
  type: SourceType;
  name: string;
  config: SourceConfig;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input para crear una nueva fuente
 */
export interface CreateSourceInput {
  type: SourceType;
  name: string;
  config: SourceConfig;
  isActive?: boolean;
}

/**
 * Input para actualizar una fuente
 */
export interface UpdateSourceInput {
  name?: string;
  config?: SourceConfig;
  isActive?: boolean;
}
