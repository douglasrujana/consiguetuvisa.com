// src/server/lib/features/blog/Blog.entity.ts

/**
 * ENTIDADES DEL DOMINIO BLOG
 * Tipos puros que representan posts, autores, categorías y tags.
 */

import type { PortableTextBlock } from '@portabletext/types';

// ============================================
// TIPOS BASE
// ============================================

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
}

// ============================================
// AUTHOR
// ============================================

export interface Author {
  _id: string;
  name: string;
  slug: string;
  avatar?: SanityImage;
  role?: string;
  bio?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface AuthorSummary {
  _id: string;
  name: string;
  slug: string;
  avatar?: SanityImage;
  role?: string;
}

// ============================================
// CATEGORY
// ============================================

export interface Category {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ============================================
// TAG
// ============================================

export interface Tag {
  _id: string;
  title: string;
  slug: string;
}

// ============================================
// POST
// ============================================

export interface PostSEO {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: SanityImage;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: SanityImage;
  author: AuthorSummary;
  category: Category;
  tags?: Tag[];
  content: PortableTextBlock[];
  publishedAt: string;
  updatedAt?: string;
  readingTime?: number;
  seo?: PostSEO;
  status: 'draft' | 'published';
  _createdAt: string;
  _updatedAt: string;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: SanityImage;
  author: AuthorSummary;
  category: Category;
  publishedAt: string;
  readingTime?: number;
}

// ============================================
// FILTERS
// ============================================

export interface PostFilters {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  author?: string;
  status?: 'draft' | 'published';
}
