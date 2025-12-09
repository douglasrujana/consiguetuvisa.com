// src/server/lib/features/page/Page.dto.ts

/**
 * DTOs Y VALIDACIÓN ZOD PARA PAGE
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

export const GetPageBySlugSchema = z.object({
  slug: z.string().min(1, 'Slug es requerido'),
});

export const ListPagesSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type GetPageBySlugDTO = z.infer<typeof GetPageBySlugSchema>;
export type ListPagesDTO = z.infer<typeof ListPagesSchema>;
