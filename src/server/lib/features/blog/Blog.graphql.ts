// src/server/lib/features/blog/Blog.graphql.ts

/**
 * GRAPHQL SCHEMA Y RESOLVERS PARA BLOG
 * Define tipos y operaciones para el blog.
 */

import { gql } from 'graphql-tag';
import type { GraphQLContext } from '@core/di/ContextFactory';

// ============================================
// TYPE DEFINITIONS
// ============================================

export const blogTypeDefs = gql`
  # Author
  type Author {
    _id: ID!
    name: String!
    slug: String!
    avatar: SanityImage
    role: String
    bio: String
    social: AuthorSocial
  }

  type AuthorSocial {
    twitter: String
    linkedin: String
    instagram: String
  }

  type AuthorSummary {
    _id: ID!
    name: String!
    slug: String!
    avatar: SanityImage
    role: String
  }

  # Category
  type Category {
    _id: ID!
    title: String!
    slug: String!
    description: String
    color: String
    icon: String
  }

  # Tag
  type Tag {
    _id: ID!
    title: String!
    slug: String!
  }

  # Post SEO
  type PostSEO {
    metaTitle: String
    metaDescription: String
    ogImage: SanityImage
  }

  # Post
  type Post {
    _id: ID!
    title: String!
    slug: String!
    excerpt: String
    featuredImage: SanityImage
    author: AuthorSummary!
    category: Category!
    tags: [Tag!]
    content: JSON
    publishedAt: String!
    updatedAt: String
    readingTime: Int
    seo: PostSEO
    status: String!
    _createdAt: String!
    _updatedAt: String!
  }

  type PostSummary {
    _id: ID!
    title: String!
    slug: String!
    excerpt: String
    featuredImage: SanityImage
    author: AuthorSummary!
    category: Category!
    publishedAt: String!
    readingTime: Int
  }

  # Pagination
  type PostsResult {
    posts: [PostSummary!]!
    total: Int!
    hasMore: Boolean!
  }

  # Queries
  extend type Query {
    "Obtiene un post por su slug"
    post(slug: String!): Post

    "Lista posts con filtros opcionales"
    posts(
      limit: Int
      offset: Int
      category: String
      tag: String
      author: String
    ): PostsResult!

    "Obtiene posts relacionados"
    relatedPosts(postId: ID!, categorySlug: String!, limit: Int): [PostSummary!]!

    "Lista todas las categorías"
    categories: [Category!]!

    "Obtiene una categoría por slug"
    category(slug: String!): Category

    "Lista todos los autores"
    authors: [Author!]!

    "Obtiene un autor por slug"
    author(slug: String!): Author

    "Lista todos los tags"
    tags: [Tag!]!
  }
`;

// ============================================
// RESOLVERS
// ============================================

export const blogResolvers = {
  Query: {
    post: async (_: unknown, { slug }: { slug: string }, context: GraphQLContext) => {
      return context.blogService.findPostBySlug(slug);
    },

    posts: async (
      _: unknown,
      args: { limit?: number; offset?: number; category?: string; tag?: string; author?: string },
      context: GraphQLContext
    ) => {
      const limit = args.limit ?? 10;
      const offset = args.offset ?? 0;

      const [posts, total] = await Promise.all([
        context.blogService.listPosts({ ...args, limit, offset }),
        context.blogService.countPosts({ category: args.category, tag: args.tag, author: args.author }),
      ]);

      return {
        posts,
        total,
        hasMore: offset + posts.length < total,
      };
    },

    relatedPosts: async (
      _: unknown,
      { postId, categorySlug, limit }: { postId: string; categorySlug: string; limit?: number },
      context: GraphQLContext
    ) => {
      return context.blogService.getRelatedPosts(postId, categorySlug, limit ?? 3);
    },

    categories: async (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.blogService.listCategories();
    },

    category: async (_: unknown, { slug }: { slug: string }, context: GraphQLContext) => {
      return context.blogService.findCategoryBySlug(slug);
    },

    authors: async (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.blogService.listAuthors();
    },

    author: async (_: unknown, { slug }: { slug: string }, context: GraphQLContext) => {
      return context.blogService.findAuthorBySlug(slug);
    },

    tags: async (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.blogService.listTags();
    },
  },
};
