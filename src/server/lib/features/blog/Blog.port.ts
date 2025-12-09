// src/server/lib/features/blog/Blog.port.ts

/**
 * PUERTO (INTERFACE) DEL REPOSITORY DE BLOG
 * Define el contrato que debe cumplir cualquier implementación.
 */

import type { Post, PostSummary, PostFilters, Author, Category, Tag } from './Blog.entity';

export interface IBlogRepository {
  // Posts
  findPostBySlug(slug: string): Promise<Post | null>;
  findPosts(filters?: PostFilters): Promise<PostSummary[]>;
  countPosts(filters?: PostFilters): Promise<number>;
  findRelatedPosts(postId: string, categorySlug: string, limit?: number): Promise<PostSummary[]>;

  // Categories
  findCategories(): Promise<Category[]>;
  findCategoryBySlug(slug: string): Promise<Category | null>;

  // Authors
  findAuthors(): Promise<Author[]>;
  findAuthorBySlug(slug: string): Promise<Author | null>;

  // Tags
  findTags(): Promise<Tag[]>;
  findTagBySlug(slug: string): Promise<Tag | null>;
}
