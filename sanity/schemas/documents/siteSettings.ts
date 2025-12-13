// sanity/schemas/documents/siteSettings.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Configuración del Sitio',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Nombre del Sitio',
      type: 'string',
      initialValue: 'ConsigueTuVisa',
    }),
    defineField({
      name: 'homePage',
      title: 'Página de Inicio',
      type: 'reference',
      to: [{ type: 'page' }],
      description: 'Selecciona la página que se mostrará como inicio',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'contact',
      title: 'Información de Contacto',
      type: 'object',
      fields: [
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'phone', title: 'Teléfono', type: 'string' }),
        defineField({ name: 'whatsapp', title: 'WhatsApp', type: 'string' }),
        defineField({ name: 'address', title: 'Dirección', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'social',
      title: 'Redes Sociales',
      type: 'object',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
        defineField({ name: 'twitter', title: 'Twitter/X', type: 'url' }),
        defineField({ name: 'linkedin', title: 'LinkedIn', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'siteName' },
    prepare({ title }) {
      return { title: title || 'Configuración del Sitio' };
    },
  },
});
