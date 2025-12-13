// sanity/schemas/blocks/hero.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Badge (etiqueta superior)',
      type: 'string',
      description: 'Ej: 97% de clientes satisfechos',
    }),
    defineField({
      name: 'title',
      title: 'Título principal',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'titleHighlight',
      title: 'Título destacado (segunda línea)',
      type: 'string',
      description: 'Se muestra en color secundario',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtítulo',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'destinations',
      title: 'Destinos',
      type: 'string',
      description: 'Ej: EE.UU | Canadá | México | Europa',
    }),
    defineField({
      name: 'ctaPrimaryText',
      title: 'Botón principal - Texto',
      type: 'string',
      initialValue: 'Evaluación Gratuita',
    }),
    defineField({
      name: 'ctaPrimaryUrl',
      title: 'Botón principal - URL',
      type: 'string',
      initialValue: '#contacto',
    }),
    defineField({
      name: 'ctaSecondaryText',
      title: 'Botón secundario - Texto',
      type: 'string',
      initialValue: 'Escríbenos Ahora',
    }),
    defineField({
      name: 'ctaSecondaryUrl',
      title: 'Botón secundario - URL',
      type: 'string',
      description: 'URL de WhatsApp',
    }),
    defineField({
      name: 'trustItems',
      title: 'Indicadores de confianza',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Ej: Revisión profesional, Asistencia completa',
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Hero',
        subtitle: 'Sección Hero',
      };
    },
  },
});
