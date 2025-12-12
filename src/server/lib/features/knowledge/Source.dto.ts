// src/server/lib/features/knowledge/Source.dto.ts

/**
 * DTOs Y VALIDACIÓN - Source
 * Validación con Zod para inputs de fuentes de datos.
 */

import { z } from 'zod';
import { SourceType } from './Source.entity';

/**
 * Schema para configuración BLOB
 */
export const BlobConfigSchema = z.object({
  type: z.literal('BLOB'),
  bucket: z.string().min(1, 'Bucket es requerido'),
  prefix: z.string().optional(),
});

/**
 * Schema para configuración SANITY
 */
export const SanityConfigSchema = z.object({
  type: z.literal('SANITY'),
  dataset: z.string().min(1, 'Dataset es requerido'),
  query: z.string().min(1, 'Query GROQ es requerida'),
});

/**
 * Schema para configuración WEB
 */
export const WebConfigSchema = z.object({
  type: z.literal('WEB'),
  urls: z.array(z.string().url('URL inválida')).min(1, 'Al menos una URL es requerida'),
  selector: z.string().optional(),
  schedule: z.string().min(1, 'Schedule es requerido'),
});

/**
 * Schema para configuración SOCIAL
 */
export const SocialConfigSchema = z.object({
  type: z.literal('SOCIAL'),
  platform: z.enum(['twitter', 'facebook', 'instagram']),
  accounts: z.array(z.string().min(1)).min(1, 'Al menos una cuenta es requerida'),
  schedule: z.string().min(1, 'Schedule es requerido'),
});

/**
 * Schema para configuración RSS
 */
export const RSSConfigSchema = z.object({
  type: z.literal('RSS'),
  feedUrls: z.array(z.string().url('URL de feed inválida')).min(1, 'Al menos un feed es requerido'),
  schedule: z.string().min(1, 'Schedule es requerido'),
});

/**
 * Schema para configuración MANUAL
 */
export const ManualConfigSchema = z.object({
  type: z.literal('MANUAL'),
});

/**
 * Schema discriminado para todas las configuraciones
 */
export const SourceConfigSchema = z.discriminatedUnion('type', [
  BlobConfigSchema,
  SanityConfigSchema,
  WebConfigSchema,
  SocialConfigSchema,
  RSSConfigSchema,
  ManualConfigSchema,
]);

/**
 * Schema para crear una fuente
 */
export const CreateSourceSchema = z.object({
  type: z.nativeEnum(SourceType),
  name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
  config: SourceConfigSchema,
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => data.type === data.config.type,
  { message: 'El tipo de source debe coincidir con el tipo de configuración' }
);

/**
 * Schema para actualizar una fuente
 */
export const UpdateSourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: SourceConfigSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreateSourceDTO = z.infer<typeof CreateSourceSchema>;
export type UpdateSourceDTO = z.infer<typeof UpdateSourceSchema>;
export type SourceConfigDTO = z.infer<typeof SourceConfigSchema>;

/**
 * Valida y parsea input para crear source
 */
export function validateCreateSource(input: unknown): CreateSourceDTO {
  return CreateSourceSchema.parse(input);
}

/**
 * Valida y parsea input para actualizar source
 */
export function validateUpdateSource(input: unknown): UpdateSourceDTO {
  return UpdateSourceSchema.parse(input);
}

/**
 * Valida configuración de source según su tipo
 */
export function validateSourceConfig(config: unknown): SourceConfigDTO {
  return SourceConfigSchema.parse(config);
}

/**
 * Verifica si una configuración es válida (sin lanzar excepción)
 */
export function isValidSourceConfig(config: unknown): config is SourceConfigDTO {
  return SourceConfigSchema.safeParse(config).success;
}
