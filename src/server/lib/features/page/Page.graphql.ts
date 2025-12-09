// src/server/lib/features/page/Page.graphql.ts

/**
 * GRAPHQL SCHEMA Y RESOLVERS PARA PAGE
 * Define tipos y operaciones para landing pages dinámicas.
 */

import { gql } from 'graphql-tag';
import type { GraphQLContext } from '@core/di/ContextFactory';

// ============================================
// TYPE DEFINITIONS
// ============================================

export const pageTypeDefs = gql`
  # Imagen de Sanity
  type SanityImage {
    asset: SanityAsset
    alt: String
  }

  type SanityAsset {
    _ref: String!
    url: String
  }

  # SEO
  type PageSEO {
    title: String
    description: String
    ogImage: SanityImage
  }

  # Bloques de Landing Page
  type HeroBlock {
    _type: String!
    _key: String!
    title: String!
    subtitle: String
    ctaText: String
    ctaUrl: String
    backgroundImage: SanityImage
  }

  type FeatureItem {
    _key: String!
    icon: String
    title: String!
    description: String!
  }

  type FeaturesBlock {
    _type: String!
    _key: String!
    title: String
    subtitle: String
    items: [FeatureItem!]!
  }

  type TestimonialItem {
    _key: String!
    quote: String!
    author: String!
    role: String
    avatar: SanityImage
  }

  type TestimonialsBlock {
    _type: String!
    _key: String!
    title: String
    items: [TestimonialItem!]!
  }

  type PricingPlan {
    _key: String!
    name: String!
    price: String!
    description: String
    features: [String!]!
    ctaText: String!
    ctaUrl: String!
    highlighted: Boolean
  }

  type PricingBlock {
    _type: String!
    _key: String!
    title: String
    subtitle: String
    plans: [PricingPlan!]!
  }

  type FAQItem {
    _key: String!
    question: String!
    answer: String!
  }

  type FAQBlock {
    _type: String!
    _key: String!
    title: String
    items: [FAQItem!]!
  }

  type CTABlock {
    _type: String!
    _key: String!
    title: String!
    subtitle: String
    buttonText: String!
    buttonUrl: String!
    variant: String
  }

  type RichTextBlock {
    _type: String!
    _key: String!
    content: JSON
  }

  # Union de todos los bloques
  union PageSection = HeroBlock | FeaturesBlock | TestimonialsBlock | PricingBlock | FAQBlock | CTABlock | RichTextBlock

  # Entidad Page
  type Page {
    _id: ID!
    title: String!
    slug: String!
    seo: PageSEO
    sections: [PageSection!]!
    publishedAt: String
    _createdAt: String!
    _updatedAt: String!
  }

  type PageSummary {
    _id: ID!
    title: String!
    slug: String!
    _updatedAt: String!
  }

  # Scalar para JSON (Portable Text)
  scalar JSON

  # Queries
  extend type Query {
    "Obtiene una página por su slug"
    page(slug: String!): Page
    
    "Lista todas las páginas"
    pages(limit: Int, offset: Int): [PageSummary!]!
    
    "Verifica si existe una página"
    pageExists(slug: String!): Boolean!
  }
`;

// ============================================
// RESOLVERS
// ============================================

export const pageResolvers = {
  Query: {
    page: async (_: unknown, { slug }: { slug: string }, context: GraphQLContext) => {
      return context.pageService.findPageBySlug(slug);
    },

    pages: async (_: unknown, args: { limit?: number; offset?: number }, context: GraphQLContext) => {
      return context.pageService.listPages(args);
    },

    pageExists: async (_: unknown, { slug }: { slug: string }, context: GraphQLContext) => {
      return context.pageService.pageExists(slug);
    },
  },

  // Resolver para el Union type
  PageSection: {
    __resolveType(obj: { _type: string }) {
      switch (obj._type) {
        case 'hero': return 'HeroBlock';
        case 'features': return 'FeaturesBlock';
        case 'testimonials': return 'TestimonialsBlock';
        case 'pricing': return 'PricingBlock';
        case 'faq': return 'FAQBlock';
        case 'cta': return 'CTABlock';
        case 'richText': return 'RichTextBlock';
        default: return null;
      }
    },
  },
};
