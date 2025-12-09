// sanity/schemas/documents/page.ts

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'page',
  title: 'Landing Page',
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
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Meta Title',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'ogImage',
          title: 'Open Graph Image',
          type: 'image',
        }),
      ],
    }),
    defineField({
      name: 'sections',
      title: 'Secciones',
      type: 'array',
      of: [
        { type: 'hero' },
        { type: 'features' },
        { type: 'testimonials' },
        { type: 'pricing' },
        { type: 'faq' },
        { type: 'cta' },
        { type: 'richText' },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    prepare({ title, slug }) {
      return {
        title,
        subtitle: `/${slug}`,
      };
    },
  },
});
