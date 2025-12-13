// sanity/schemas/blocks/trust.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'trust',
  title: 'Indicadores de Confianza',
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
      title: 'Indicadores',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Valor/Número',
              type: 'string',
              description: 'Ej: 500+, 98%, 10 años',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Etiqueta',
              type: 'string',
              description: 'Ej: Clientes satisfechos',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Icono',
              type: 'string',
            }),
          ],
          preview: {
            select: { value: 'value', label: 'label' },
            prepare({ value, label }) {
              return { title: `${value} - ${label}` };
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
        title: title || 'Confianza',
        subtitle: 'Indicadores de confianza',
      };
    },
  },
});
