// src/server/lib/features/page/Page.entity.ts

/**
 * ENTIDADES DEL DOMINIO PAGE
 * Tipos puros que representan las landing pages y sus bloques.
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

export interface SEO {
  title?: string;
  description?: string;
  ogImage?: SanityImage;
}

// ============================================
// BLOQUES DE LANDING PAGE
// ============================================

export interface HeroBlock {
  _type: 'hero';
  _key: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundImage?: SanityImage;
}

export interface FeaturesBlock {
  _type: 'features';
  _key: string;
  title?: string;
  subtitle?: string;
  items: Array<{
    _key: string;
    icon?: string;
    title: string;
    description: string;
  }>;
}

export interface TestimonialsBlock {
  _type: 'testimonials';
  _key: string;
  title?: string;
  items: Array<{
    _key: string;
    quote: string;
    author: string;
    role?: string;
    avatar?: SanityImage;
  }>;
}

export interface PricingBlock {
  _type: 'pricing';
  _key: string;
  title?: string;
  subtitle?: string;
  plans: Array<{
    _key: string;
    name: string;
    price: string;
    description?: string;
    features: string[];
    ctaText: string;
    ctaUrl: string;
    highlighted?: boolean;
  }>;
}

export interface FAQBlock {
  _type: 'faq';
  _key: string;
  title?: string;
  items: Array<{
    _key: string;
    question: string;
    answer: string;
  }>;
}

export interface CTABlock {
  _type: 'cta';
  _key: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonUrl: string;
  variant?: 'primary' | 'secondary';
}

export interface RichTextBlock {
  _type: 'richText';
  _key: string;
  content: PortableTextBlock[];
}

// Union de todos los bloques posibles
export type PageSection = 
  | HeroBlock 
  | FeaturesBlock 
  | TestimonialsBlock 
  | PricingBlock 
  | FAQBlock 
  | CTABlock
  | RichTextBlock;

// ============================================
// ENTIDAD PRINCIPAL: PAGE
// ============================================

export interface Page {
  _id: string;
  _type: 'page';
  title: string;
  slug: string;
  seo?: SEO;
  sections: PageSection[];
  publishedAt?: string;
  _createdAt: string;
  _updatedAt: string;
}

export interface PageSummary {
  _id: string;
  title: string;
  slug: string;
  _updatedAt: string;
}
