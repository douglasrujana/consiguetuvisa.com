// sanity/schemas/index.ts

// Documents - Pages
import page from './documents/page';

// Documents - Blog
import post from './documents/post';
import author from './documents/author';
import category from './documents/category';
import tag from './documents/tag';

// Documents - Promo
import campaign from './documents/campaign';
import prize from './documents/prize';
import cardBrand from './documents/cardBrand';

// Blocks
import hero from './blocks/hero';
import features from './blocks/features';
import testimonials from './blocks/testimonials';
import pricing from './blocks/pricing';
import faq from './blocks/faq';
import cta from './blocks/cta';
import richText from './blocks/richText';

export const schemaTypes = [
  // Documents - Pages
  page,
  // Documents - Blog
  post,
  author,
  category,
  tag,
  // Documents - Promo
  campaign,
  prize,
  cardBrand,
  // Blocks
  hero,
  features,
  testimonials,
  pricing,
  faq,
  cta,
  richText,
];
