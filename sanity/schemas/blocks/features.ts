// sanity/schemas/blocks/features.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'features',
  title: 'Features',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtítulo',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'items',
      title: 'Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icono',
              type: 'string',
              description: 'Nombre del icono (ej: check, star, shield)',
            }),
            defineField({
              name: 'title',
              title: 'Título',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Descripción',
              type: 'text',
              rows: 2,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'title' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Features',
        subtitle: 'Sección de características',
      };
    },
  },
});
