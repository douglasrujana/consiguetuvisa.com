// src/server/lib/features/blog/Blog.dto.ts

/**
 * DTOs Y VALIDACIÓN ZOD PARA BLOG
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

export const GetPostBySlugSchema = z.object({
  slug: z.string().min(1, 'Slug es requerido'),
});

export const ListPostsSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0),
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
});

export const GetCategoryBySlugSchema = z.object({
  slug: z.string().min(1, 'Slug es requerido'),
});

export const GetAuthorBySlugSchema = z.object({
  slug: z.string().min(1, 'Slug es requerido'),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type GetPostBySlugDTO = z.infer<typeof GetPostBySlugSchema>;
export type ListPostsDTO = z.infer<typeof ListPostsSchema>;
export type GetCategoryBySlugDTO = z.infer<typeof GetCategoryBySlugSchema>;
export type GetAuthorBySlugDTO = z.infer<typeof GetAuthorBySlugSchema>;
