// src/server/lib/features/page/Page.repository.ts

/**
 * REPOSITORY DE PAGE - Implementación con Sanity
 * Queries GROQ específicas para el dominio Page.
 */

import { sanityClient } from '@adapters/cms';
import type { IPageRepository } from './Page.port';
import type { Page, PageSummary } from './Page.entity';

// ============================================
// GROQ QUERIES
// ============================================

const PAGE_FIELDS = `
  _id,
  _type,
  title,
  "slug": slug.current,
  seo {
    title,
    description,
    ogImage
  },
  sections[] {
    _type,
    _key,
    ...,
    items[] {
      _key,
      ...
    },
    plans[] {
      _key,
      ...
    }
  },
  publishedAt,
  _createdAt,
  _updatedAt
`;

const PAGE_SUMMARY_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  _updatedAt
`;

// ============================================
// REPOSITORY IMPLEMENTATION
// ============================================

export class PageRepository implements IPageRepository {
  
  async findBySlug(slug: string): Promise<Page | null> {
    const query = `*[_type == "page" && slug.current == $slug][0] {
      ${PAGE_FIELDS}
    }`;
    
    const page = await sanityClient.fetch<Page | null>(query, { slug });
    return page;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<PageSummary[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    
    const query = `*[_type == "page"] | order(_updatedAt desc) [${offset}...${offset + limit}] {
      ${PAGE_SUMMARY_FIELDS}
    }`;
    
    const pages = await sanityClient.fetch<PageSummary[]>(query);
    return pages ?? [];
  }

  async exists(slug: string): Promise<boolean> {
    const query = `count(*[_type == "page" && slug.current == $slug]) > 0`;
    return sanityClient.fetch<boolean>(query, { slug });
  }
}
