// src/server/lib/features/blog/Blog.repository.ts

/**
 * REPOSITORY DE BLOG - Implementación con Sanity
 * Queries GROQ específicas para el dominio Blog.
 */

import { sanityClient } from '@adapters/cms';
import type { IBlogRepository } from './Blog.port';
import type { Post, PostSummary, PostFilters, Author, Category, Tag } from './Blog.entity';

// ============================================
// GROQ QUERIES
// ============================================

const AUTHOR_SUMMARY_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  avatar,
  role
`;

const CATEGORY_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description,
  color,
  icon
`;

const TAG_FIELDS = `
  _id,
  title,
  "slug": slug.current
`;

const POST_SUMMARY_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featuredImage,
  "author": author->{${AUTHOR_SUMMARY_FIELDS}},
  "category": category->{${CATEGORY_FIELDS}},
  publishedAt,
  readingTime
`;

const POST_FULL_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featuredImage,
  "author": author->{
    _id,
    name,
    "slug": slug.current,
    avatar,
    role,
    bio,
    social
  },
  "category": category->{${CATEGORY_FIELDS}},
  "tags": tags[]->{${TAG_FIELDS}},
  content,
  publishedAt,
  updatedAt,
  readingTime,
  seo,
  status,
  _createdAt,
  _updatedAt
`;

// ============================================
// REPOSITORY IMPLEMENTATION
// ============================================

export class BlogRepository implements IBlogRepository {
  // ==========================================
  // POSTS
  // ==========================================

  async findPostBySlug(slug: string): Promise<Post | null> {
    const query = `*[_type == "post" && slug.current == $slug && status == "published"][0] {
      ${POST_FULL_FIELDS}
    }`;

    return sanityClient.fetch<Post | null>(query, { slug });
  }

  async findPosts(filters?: PostFilters): Promise<PostSummary[]> {
    const limit = filters?.limit ?? 10;
    const offset = filters?.offset ?? 0;

    let conditions = ['_type == "post"', 'status == "published"'];

    if (filters?.category) {
      conditions.push('category->slug.current == $category');
    }
    if (filters?.tag) {
      conditions.push('$tag in tags[]->slug.current');
    }
    if (filters?.author) {
      conditions.push('author->slug.current == $author');
    }

    const query = `*[${conditions.join(' && ')}] | order(publishedAt desc) [${offset}...${offset + limit}] {
      ${POST_SUMMARY_FIELDS}
    }`;

    return sanityClient.fetch<PostSummary[]>(query, {
      category: filters?.category,
      tag: filters?.tag,
      author: filters?.author,
    }) ?? [];
  }

  async countPosts(filters?: PostFilters): Promise<number> {
    let conditions = ['_type == "post"', 'status == "published"'];

    if (filters?.category) {
      conditions.push('category->slug.current == $category');
    }
    if (filters?.tag) {
      conditions.push('$tag in tags[]->slug.current');
    }
    if (filters?.author) {
      conditions.push('author->slug.current == $author');
    }

    const query = `count(*[${conditions.join(' && ')}])`;

    return sanityClient.fetch<number>(query, {
      category: filters?.category,
      tag: filters?.tag,
      author: filters?.author,
    }) ?? 0;
  }

  async findRelatedPosts(postId: string, categorySlug: string, limit = 3): Promise<PostSummary[]> {
    const query = `*[_type == "post" && status == "published" && _id != $postId && category->slug.current == $categorySlug] | order(publishedAt desc) [0...${limit}] {
      ${POST_SUMMARY_FIELDS}
    }`;

    return sanityClient.fetch<PostSummary[]>(query, { postId, categorySlug }) ?? [];
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  async findCategories(): Promise<Category[]> {
    const query = `*[_type == "category"] | order(title asc) {
      ${CATEGORY_FIELDS}
    }`;

    return sanityClient.fetch<Category[]>(query) ?? [];
  }

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    const query = `*[_type == "category" && slug.current == $slug][0] {
      ${CATEGORY_FIELDS}
    }`;

    return sanityClient.fetch<Category | null>(query, { slug });
  }

  // ==========================================
  // AUTHORS
  // ==========================================

  async findAuthors(): Promise<Author[]> {
    const query = `*[_type == "author"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      avatar,
      role,
      bio,
      social
    }`;

    return sanityClient.fetch<Author[]>(query) ?? [];
  }

  async findAuthorBySlug(slug: string): Promise<Author | null> {
    const query = `*[_type == "author" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      avatar,
      role,
      bio,
      social
    }`;

    return sanityClient.fetch<Author | null>(query, { slug });
  }

  // ==========================================
  // TAGS
  // ==========================================

  async findTags(): Promise<Tag[]> {
    const query = `*[_type == "tag"] | order(title asc) {
      ${TAG_FIELDS}
    }`;

    return sanityClient.fetch<Tag[]>(query) ?? [];
  }

  async findTagBySlug(slug: string): Promise<Tag | null> {
    const query = `*[_type == "tag" && slug.current == $slug][0] {
      ${TAG_FIELDS}
    }`;

    return sanityClient.fetch<Tag | null>(query, { slug });
  }
}
