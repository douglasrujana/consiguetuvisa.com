// sanity/schemas/documents/campaign.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'campaign',
  title: 'Campaña Promocional',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre de la campaña',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'country',
      title: 'País',
      type: 'string',
      options: {
        list: [
          { title: 'Ecuador', value: 'EC' },
          { title: 'Colombia', value: 'CO' },
          { title: 'Perú', value: 'PE' },
          { title: 'México', value: 'MX' },
          { title: 'Estados Unidos', value: 'US' },
        ],
      },
      initialValue: 'EC',
    }),
    defineField({
      name: 'startDate',
      title: 'Fecha de inicio',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de fin',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'maxParticipationsPerEmail',
      title: 'Máximo participaciones por email',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'prizes',
      title: 'Premios',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'prize' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'cardBrands',
      title: 'Marcas de tarjetas aceptadas',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'cardBrand' }] }],
    }),
    defineField({
      name: 'agencyInfo',
      title: 'Información de la agencia',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Nombre', type: 'string' }),
        defineField({ name: 'address', title: 'Dirección', type: 'string' }),
        defineField({ name: 'phone', title: 'Teléfono', type: 'string' }),
        defineField({ name: 'whatsapp', title: 'WhatsApp', type: 'string' }),
        defineField({ name: 'ruc', title: 'RUC/NIT', type: 'string' }),
        defineField({ name: 'website', title: 'Sitio web', type: 'url' }),
        defineField({ name: 'logo', title: 'Logo', type: 'image' }),
        defineField({ name: 'photo', title: 'Foto del local', type: 'image' }),
      ],
    }),
    defineField({
      name: 'termsAndConditions',
      title: 'Términos y condiciones',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'privacyPolicy',
      title: 'Política de privacidad',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'theme',
      title: 'Tema visual',
      type: 'object',
      fields: [
        defineField({ name: 'primaryColor', title: 'Color primario', type: 'string' }),
        defineField({ name: 'secondaryColor', title: 'Color secundario', type: 'string' }),
        defineField({ name: 'backgroundImage', title: 'Imagen de fondo', type: 'image' }),
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Activa',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'country',
      media: 'agencyInfo.logo',
    },
    prepare({ title, subtitle, media }) {
      const countries: Record<string, string> = { EC: '🇪🇨', CO: '🇨🇴', PE: '🇵🇪', MX: '🇲🇽', US: '🇺🇸' };
      return {
        title,
        subtitle: `${countries[subtitle] || ''} ${subtitle}`,
        media,
      };
    },
  },
});
