// sanity/schemas/blocks/services.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'services',
  title: 'Servicios/Tipos de Visa',
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
      title: 'Servicios',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'country',
              title: 'País/Destino',
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
              name: 'flagCode',
              title: 'Código de bandera',
              type: 'string',
              description: 'Código ISO del país (us, ca, mx, eu, gb, etc.)',
            }),
            defineField({
              name: 'link',
              title: 'Enlace',
              type: 'string',
            }),
          ],
          preview: {
            select: { title: 'country', subtitle: 'description' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Servicios',
        subtitle: 'Sección de servicios',
      };
    },
  },
});
