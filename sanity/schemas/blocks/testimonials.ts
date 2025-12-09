// sanity/schemas/blocks/testimonials.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'testimonials',
  title: 'Testimonials',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
    }),
    defineField({
      name: 'items',
      title: 'Testimonios',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'quote',
              title: 'Testimonio',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'author',
              title: 'Autor',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Cargo/Rol',
              type: 'string',
            }),
            defineField({
              name: 'avatar',
              title: 'Foto',
              type: 'image',
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: 'author', media: 'avatar' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Testimonios',
        subtitle: 'Sección de testimonios',
      };
    },
  },
});
