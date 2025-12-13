// sanity/schemas/blocks/steps.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'steps',
  title: 'Pasos del Proceso',
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
      title: 'Pasos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'number',
              title: 'Número',
              type: 'string',
              description: 'Ej: 01, 02, 03',
              validation: (Rule) => Rule.required(),
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
            }),
            defineField({
              name: 'icon',
              title: 'Icono',
              type: 'string',
              description: 'Nombre del icono (users, document, calendar, shield)',
            }),
          ],
          preview: {
            select: { title: 'title', number: 'number' },
            prepare({ title, number }) {
              return {
                title: `${number || '•'} ${title}`,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Proceso',
        subtitle: 'Pasos del proceso',
      };
    },
  },
});
