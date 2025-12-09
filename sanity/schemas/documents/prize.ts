// sanity/schemas/documents/prize.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'prize',
  title: 'Premio',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre del premio',
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
      name: 'type',
      title: 'Tipo de premio',
      type: 'string',
      options: {
        list: [
          { title: 'Viaje', value: 'travel' },
          { title: 'Gift Card', value: 'giftcard' },
          { title: 'Asesoría Gratis', value: 'service' },
          { title: 'Descuento', value: 'discount' },
          { title: 'Cena', value: 'dinner' },
          { title: 'Boleto Aéreo', value: 'flight' },
          { title: 'Sigue Participando', value: 'retry' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Valor ($)',
      type: 'number',
      description: 'Valor monetario del premio (0 para "Sigue participando")',
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'color',
      title: 'Color en la ruleta',
      type: 'string',
      description: 'Color hexadecimal (ej: #FF5733)',
    }),
    defineField({
      name: 'probability',
      title: 'Probabilidad (%)',
      type: 'number',
      description: 'Probabilidad de ganar este premio (0-100)',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'inventory',
      title: 'Inventario disponible',
      type: 'number',
      description: 'Cantidad disponible (-1 para ilimitado)',
      initialValue: -1,
    }),
    defineField({
      name: 'expirationDays',
      title: 'Días para canjear',
      type: 'number',
      description: 'Días que tiene el ganador para canjear el premio',
      initialValue: 30,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      media: 'image',
      probability: 'probability',
      value: 'value',
    },
    prepare({ title, subtitle, media, probability, value }) {
      const types: Record<string, string> = {
        travel: '✈️', giftcard: '🎁', service: '📋', discount: '💰', dinner: '🍽️', flight: '🎫', retry: '🔄'
      };
      return {
        title: `${types[subtitle] || ''} ${title}`,
        subtitle: `${probability}% prob. | $${value || 0}`,
        media,
      };
    },
  },
});
