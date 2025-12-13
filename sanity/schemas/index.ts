// sanity/schemas/index.ts
/**
 * SANITY SCHEMA INDEX
 * 
 * Arquitectura:
 * - Documents: Contenido independiente (páginas, posts, etc.)
 * - Blocks: Secciones reutilizables dentro de páginas
 */

// === DOCUMENTS ===
import page from './documents/page';
import siteSettings from './documents/siteSettings';
import post from './documents/post';
import author from './documents/author';
import category from './documents/category';
import tag from './documents/tag';

// Documents - Promo
import campaign from './documents/campaign';
import prize from './documents/prize';
import cardBrand from './documents/cardBrand';

// === BLOCKS (secciones de página) ===
import hero from './blocks/hero';
import features from './blocks/features';
import services from './blocks/services';
import steps from './blocks/steps';
import trust from './blocks/trust';
import testimonials from './blocks/testimonials';
import faq from './blocks/faq';
import pricing from './blocks/pricing';
import cta from './blocks/cta';
import contact from './blocks/contact';
import richText from './blocks/richText';

export const schemaTypes = [
  // Documents
  page,
  siteSettings,
  post,
  author,
  category,
  tag,
  campaign,
  prize,
  cardBrand,
  
  // Blocks
  hero,
  features,
  services,
  steps,
  trust,
  testimonials,
  faq,
  pricing,
  cta,
  contact,
  richText,
];
