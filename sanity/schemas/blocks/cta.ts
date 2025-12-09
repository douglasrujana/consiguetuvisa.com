// sanity/schemas/blocks/cta.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'cta',
  title: 'Call to Action',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtítulo',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'buttonText',
      title: 'Texto del botón',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'buttonUrl',
      title: 'URL del botón',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Variante',
      type: 'string',
      options: {
        list: [
          { title: 'Primario', value: 'primary' },
          { title: 'Secundario', value: 'secondary' },
        ],
      },
      initialValue: 'primary',
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'CTA',
        subtitle: 'Call to Action',
      };
    },
  },
});
