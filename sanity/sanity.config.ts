// sanity/sanity.config.ts

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';

const config = defineConfig({
  name: 'consiguetuvisa',
  title: 'ConsigueTuVisa CMS',

  projectId: 'zvbggttz',
  dataset: 'production',

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },

  basePath: '/studio',
});

export default config;
