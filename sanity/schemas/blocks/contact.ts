// sanity/schemas/blocks/contact.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'contact',
  title: 'Formulario de Contacto',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtítulo',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'formType',
      title: 'Tipo de formulario',
      type: 'string',
      options: {
        list: [
          { title: 'Contacto general', value: 'contact' },
          { title: 'Evaluación gratuita', value: 'evaluation' },
          { title: 'Agendar cita', value: 'appointment' },
        ],
      },
      initialValue: 'evaluation',
    }),
    defineField({
      name: 'buttonText',
      title: 'Texto del botón',
      type: 'string',
      initialValue: 'Enviar',
    }),
    defineField({
      name: 'showPhone',
      title: 'Mostrar teléfono',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'showWhatsApp',
      title: 'Mostrar WhatsApp',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'showEmail',
      title: 'Mostrar email',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Contacto',
        subtitle: 'Formulario de contacto',
      };
    },
  },
});
