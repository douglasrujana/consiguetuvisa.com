// sanity/schemas/documents/page.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'page',
  title: 'Página',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenido', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Secciones',
      type: 'array',
      group: 'content',
      of: [
        { type: 'hero' },
        { type: 'features' },
        { type: 'services' },
        { type: 'steps' },
        { type: 'trust' },
        { type: 'testimonials' },
        { type: 'faq' },
        { type: 'pricing' },
        { type: 'cta' },
        { type: 'contact' },
        { type: 'richText' },
      ],
    }),
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'Meta Title',
      type: 'string',
      group: 'seo',
      description: 'Título para SEO (si es diferente al título)',
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
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
        subtitle: `/${slug || ''}`,
      };
    },
  },
});
