// sanity/schemas/blocks/pricing.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pricing',
  title: 'Pricing',
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
      name: 'plans',
      title: 'Planes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Nombre del plan',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'price',
              title: 'Precio',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Descripción',
              type: 'text',
              rows: 2,
            }),
            defineField({
              name: 'features',
              title: 'Características',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({
              name: 'ctaText',
              title: 'Texto del botón',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'ctaUrl',
              title: 'URL del botón',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'highlighted',
              title: 'Destacado',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'price' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Precios',
        subtitle: 'Sección de precios',
      };
    },
  },
});
