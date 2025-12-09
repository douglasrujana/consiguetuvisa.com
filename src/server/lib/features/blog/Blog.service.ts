// src/server/lib/features/blog/Blog.service.ts

/**
 * SERVICIO DE BLOG - Lógica de Negocio
 * Orquesta las operaciones del dominio Blog.
 */

import type { IBlogRepository } from './Blog.port';
import type { Post, PostSummary, Author, Category, Tag } from './Blog.entity';
import { GetPostBySlugSchema, ListPostsSchema, GetCategoryBySlugSchema, GetAuthorBySlugSchema } from './Blog.dto';
import { NotFoundError } from '@core/error/Domain.error';

export class BlogService {
  constructor(private readonly blogRepository: IBlogRepository) {}

  // ==========================================
  // POSTS
  // ==========================================

  async getPostBySlug(slug: string): Promise<Post> {
    const validated = GetPostBySlugSchema.parse({ slug });
    const post = await this.blogRepository.findPostBySlug(validated.slug);

    if (!post) {
      throw new NotFoundError(`Post '${slug}' no encontrado`);
    }

    return post;
  }

  async findPostBySlug(slug: string): Promise<Post | null> {
    const validated = GetPostBySlugSchema.parse({ slug });
    return this.blogRepository.findPostBySlug(validated.slug);
  }

  async listPosts(options?: {
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
    author?: string;
  }): Promise<PostSummary[]> {
    const validated = ListPostsSchema.parse(options ?? {});
    return this.blogRepository.findPosts(validated);
  }

  async countPosts(options?: {
    category?: string;
    tag?: string;
    author?: string;
  }): Promise<number> {
    return this.blogRepository.countPosts(options);
  }

  async getRelatedPosts(postId: string, categorySlug: string, limit = 3): Promise<PostSummary[]> {
    return this.blogRepository.findRelatedPosts(postId, categorySlug, limit);
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  async listCategories(): Promise<Category[]> {
    return this.blogRepository.findCategories();
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const validated = GetCategoryBySlugSchema.parse({ slug });
    const category = await this.blogRepository.findCategoryBySlug(validated.slug);

    if (!category) {
      throw new NotFoundError(`Categoría '${slug}' no encontrada`);
    }

    return category;
  }

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    const validated = GetCategoryBySlugSchema.parse({ slug });
    return this.blogRepository.findCategoryBySlug(validated.slug);
  }

  // ==========================================
  // AUTHORS
  // ==========================================

  async listAuthors(): Promise<Author[]> {
    return this.blogRepository.findAuthors();
  }

  async getAuthorBySlug(slug: string): Promise<Author> {
    const validated = GetAuthorBySlugSchema.parse({ slug });
    const author = await this.blogRepository.findAuthorBySlug(validated.slug);

    if (!author) {
      throw new NotFoundError(`Autor '${slug}' no encontrado`);
    }

    return author;
  }

  async findAuthorBySlug(slug: string): Promise<Author | null> {
    const validated = GetAuthorBySlugSchema.parse({ slug });
    return this.blogRepository.findAuthorBySlug(validated.slug);
  }

  // ==========================================
  // TAGS
  // ==========================================

  async listTags(): Promise<Tag[]> {
    return this.blogRepository.findTags();
  }

  async findTagBySlug(slug: string): Promise<Tag | null> {
    return this.blogRepository.findTagBySlug(slug);
  }
}
