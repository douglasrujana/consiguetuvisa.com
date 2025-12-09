// sanity/schemas/documents/author.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'author',
  title: 'Autor',
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
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'role',
      title: 'Cargo',
      type: 'string',
      description: 'Ej: Especialista en Visas, Fundador',
    }),
    defineField({
      name: 'bio',
      title: 'Biografía',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'social',
      title: 'Redes sociales',
      type: 'object',
      fields: [
        defineField({ name: 'twitter', title: 'Twitter/X', type: 'url' }),
        defineField({ name: 'linkedin', title: 'LinkedIn', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'avatar',
    },
  },
});
