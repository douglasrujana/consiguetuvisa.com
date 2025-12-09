// sanity/schemas/documents/cardBrand.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'cardBrand',
  title: 'Marca de Tarjeta',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variants',
      title: 'Variantes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Nombre', type: 'string' }),
            defineField({ name: 'tier', title: 'Nivel', type: 'string', 
              options: { list: ['classic', 'gold', 'platinum', 'black', 'signature', 'infinite', 'world'] }
            }),
            defineField({ name: 'logo', title: 'Logo variante', type: 'image' }),
            defineField({ name: 'spinsBonus', title: 'Giros extra', type: 'number', initialValue: 0 }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'tier', media: 'logo' },
          },
        },
      ],
    }),
    defineField({
      name: 'countries',
      title: 'Países disponibles',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Ecuador', value: 'EC' },
          { title: 'Colombia', value: 'CO' },
          { title: 'Perú', value: 'PE' },
          { title: 'México', value: 'MX' },
          { title: 'Estados Unidos', value: 'US' },
        ],
      },
    }),
    defineField({
      name: 'spinsPerCard',
      title: 'Giros por tarjeta',
      type: 'number',
      description: 'Cantidad de giros que otorga tener esta tarjeta',
      initialValue: 1,
    }),
    defineField({
      name: 'order',
      title: 'Orden de visualización',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logo',
      spins: 'spinsPerCard',
    },
    prepare({ title, media, spins }) {
      return {
        title,
        subtitle: `${spins} giro(s) por tarjeta`,
        media,
      };
    },
  },
  orderings: [
    { title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
});
