// sanity/schemas/blocks/testimonials.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'testimonials',
  title: 'Testimonios',
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
      title: 'Testimonios',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Nombre',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'text',
              title: 'Testimonio',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'location',
              title: 'Ciudad',
              type: 'string',
            }),
            defineField({
              name: 'visa',
              title: 'Tipo de Visa',
              type: 'string',
            }),
            defineField({
              name: 'rating',
              title: 'Calificación',
              type: 'number',
              options: {
                list: [1, 2, 3, 4, 5],
              },
              initialValue: 5,
            }),
            defineField({
              name: 'avatar',
              title: 'Foto',
              type: 'image',
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'visa', media: 'avatar' },
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
