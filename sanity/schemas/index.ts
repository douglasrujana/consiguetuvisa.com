// sanity/schemas/index.ts

// Documents
import page from './documents/page';

// Blocks
import hero from './blocks/hero';
import features from './blocks/features';
import testimonials from './blocks/testimonials';
import pricing from './blocks/pricing';
import faq from './blocks/faq';
import cta from './blocks/cta';
import richText from './blocks/richText';

export const schemaTypes = [
  // Documents
  page,
  // Blocks
  hero,
  features,
  testimonials,
  pricing,
  faq,
  cta,
  richText,
];
