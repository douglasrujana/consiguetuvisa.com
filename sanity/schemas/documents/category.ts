// sanity/schemas/documents/category.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'category',
  title: 'Categoría',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Color para badges (ej: #3182ce)',
    }),
    defineField({
      name: 'icon',
      title: 'Icono',
      type: 'string',
      description: 'Emoji o nombre de icono',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle || 'Sin descripción',
      };
    },
  },
});
