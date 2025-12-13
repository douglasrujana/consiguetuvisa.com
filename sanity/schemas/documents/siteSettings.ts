// sanity/schemas/documents/siteSettings.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Configuración del Sitio',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'contact', title: 'Contacto' },
    { name: 'social', title: 'Redes Sociales' },
    { name: 'trust', title: 'Confianza' },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    // General
    defineField({
      name: 'siteName',
      title: 'Nombre del sitio',
      type: 'string',
      group: 'general',
      initialValue: 'ConsigueTuVisa',
    }),
    defineField({
      name: 'tagline',
      title: 'Eslogan',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 2,
      group: 'general',
    }),
    defineField({
      name: 'location',
      title: 'Ubicación',
      type: 'string',
      group: 'general',
      initialValue: 'Quito, Ecuador',
    }),

    // Contacto
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp (número completo)',
      type: 'string',
      group: 'contact',
      description: 'Ej: 593999999999',
    }),
    defineField({
      name: 'address',
      title: 'Dirección',
      type: 'text',
      rows: 2,
      group: 'contact',
    }),

    // Redes Sociales
    defineField({
      name: 'facebook',
      title: 'Facebook URL',
      type: 'url',
      group: 'social',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
      group: 'social',
    }),
    defineField({
      name: 'tiktok',
      title: 'TikTok URL',
      type: 'url',
      group: 'social',
    }),

    // Logos de métodos de pago
    defineField({
      name: 'paymentLogos',
      title: 'Logos de Métodos de Pago',
      type: 'array',
      group: 'trust',
      description: 'Logos de tarjetas y métodos de pago aceptados',
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
              name: 'image', 
              title: 'Logo', 
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { 
              title: 'name',
              media: 'image',
            },
          },
        },
      ],
    }),

    // Footer Links
    defineField({
      name: 'footerServices',
      title: 'Links de Servicios',
      type: 'array',
      group: 'footer',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Texto', type: 'string' }),
            defineField({ name: 'href', title: 'URL', type: 'string' }),
          ],
          preview: {
            select: { title: 'label' },
          },
        },
      ],
    }),
    defineField({
      name: 'footerCompany',
      title: 'Links de Empresa',
      type: 'array',
      group: 'footer',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Texto', type: 'string' }),
            defineField({ name: 'href', title: 'URL', type: 'string' }),
          ],
          preview: {
            select: { title: 'label' },
          },
        },
      ],
    }),
    defineField({
      name: 'footerLegal',
      title: 'Links Legales',
      type: 'array',
      group: 'footer',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Texto', type: 'string' }),
            defineField({ name: 'href', title: 'URL', type: 'string' }),
          ],
          preview: {
            select: { title: 'label' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Configuración del Sitio',
        subtitle: 'Footer, contacto, redes sociales',
      };
    },
  },
});
