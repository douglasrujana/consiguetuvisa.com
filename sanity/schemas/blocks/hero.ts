// sanity/schemas/blocks/hero.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'hero',
  title: 'Hero',
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
      name: 'ctaText',
      title: 'Texto del botón',
      type: 'string',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'URL del botón',
      type: 'string',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Imagen de fondo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'backgroundImage',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Hero',
        subtitle: 'Sección Hero',
        media,
      };
    },
  },
});
