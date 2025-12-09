// src/pages/studio/Studio.tsx

/**
 * Componente React que renderiza Sanity Studio
 */

import { Studio as SanityStudio } from 'sanity';
import config from '../../../sanity/sanity.config';

export function Studio() {
  return <SanityStudio config={config} />;
}
