// scripts/seed-blog.ts

/**
 * Script para crear contenido de prueba del blog en Sanity
 * Ejecutar: pnpm tsx scripts/seed-blog.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'zvbggttz',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Datos de prueba
const author = {
  _type: 'author',
  name: 'María González',
  slug: { _type: 'slug', current: 'maria-gonzalez' },
  role: 'Especialista en Visas',
  bio: 'Más de 10 años de experiencia ayudando a ecuatorianos a conseguir sus visas de turismo. Apasionada por hacer realidad los sueños de viaje de nuestros clientes.',
};

const categories = [
  {
    _type: 'category',
    title: 'Visa USA',
    slug: { _type: 'slug', current: 'visa-usa' },
    description: 'Todo sobre la visa de turismo B1/B2 para Estados Unidos',
    color: '#2563eb',
    icon: '🇺🇸',
  },
  {
    _type: 'category',
    title: 'Visa Canadá',
    slug: { _type: 'slug', current: 'visa-canada' },
    description: 'Guías para obtener la visa de visitante canadiense',
    color: '#dc2626',
    icon: '🇨🇦',
  },
  {
    _type: 'category',
    title: 'Consejos',
    slug: { _type: 'slug', current: 'consejos' },
    description: 'Tips y recomendaciones para tu proceso de visa',
    color: '#10b981',
    icon: '💡',
  },
];

const tags = [
  { _type: 'tag', title: 'DS-160', slug: { _type: 'slug', current: 'ds-160' } },
  { _type: 'tag', title: 'Entrevista', slug: { _type: 'slug', current: 'entrevista' } },
  { _type: 'tag', title: 'Documentos', slug: { _type: 'slug', current: 'documentos' } },
  { _type: 'tag', title: 'Requisitos', slug: { _type: 'slug', current: 'requisitos' } },
];

async function seedBlog() {
  console.log('🌱 Creando contenido del blog en Sanity...\n');

  try {
    // 1. Crear autor
    console.log('👤 Creando autor...');
    const existingAuthor = await client.fetch(
      `*[_type == "author" && slug.current == $slug][0]`,
      { slug: 'maria-gonzalez' }
    );
    
    let authorRef: string;
    if (existingAuthor) {
      authorRef = existingAuthor._id;
      console.log('   Autor ya existe:', existingAuthor._id);
    } else {
      const createdAuthor = await client.create(author);
      authorRef = createdAuthor._id;
      console.log('   ✅ Autor creado:', createdAuthor._id);
    }

    // 2. Crear categorías
    console.log('\n📁 Creando categorías...');
    const categoryRefs: Record<string, string> = {};
    
    for (const cat of categories) {
      const existing = await client.fetch(
        `*[_type == "category" && slug.current == $slug][0]`,
        { slug: cat.slug.current }
      );
      
      if (existing) {
        categoryRefs[cat.slug.current] = existing._id;
        console.log(`   ${cat.title} ya existe`);
      } else {
        const created = await client.create(cat);
        categoryRefs[cat.slug.current] = created._id;
        console.log(`   ✅ ${cat.title} creada`);
      }
    }

    // 3. Crear tags
    console.log('\n🏷️  Creando tags...');
    const tagRefs: Record<string, string> = {};
    
    for (const tag of tags) {
      const existing = await client.fetch(
        `*[_type == "tag" && slug.current == $slug][0]`,
        { slug: tag.slug.current }
      );
      
      if (existing) {
        tagRefs[tag.slug.current] = existing._id;
        console.log(`   ${tag.title} ya existe`);
      } else {
        const created = await client.create(tag);
        tagRefs[tag.slug.current] = created._id;
        console.log(`   ✅ ${tag.title} creado`);
      }
    }

    // 4. Crear posts de ejemplo
    console.log('\n📝 Creando posts...');
    
    const posts = [
      {
        _type: 'post',
        title: 'Requisitos para la Visa de Turismo USA 2025: Guía Completa',
        slug: { _type: 'slug', current: 'requisitos-visa-turismo-usa-2025' },
        excerpt: 'Todo lo que necesitas saber para solicitar tu visa B1/B2 de turismo a Estados Unidos este año.',
        author: { _type: 'reference', _ref: authorRef },
        category: { _type: 'reference', _ref: categoryRefs['visa-usa'] },
        tags: [
          { _type: 'reference', _ref: tagRefs['requisitos'], _key: 't1' },
          { _type: 'reference', _ref: tagRefs['documentos'], _key: 't2' },
        ],
        content: [
          { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'Obtener la visa de turismo para Estados Unidos puede parecer complicado, pero con la preparación adecuada, el proceso es más sencillo de lo que piensas.' }] },
          { _type: 'block', _key: 'b2', style: 'h2', children: [{ _type: 'span', _key: 's2', text: 'Documentos necesarios' }] },
          { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Para tu cita en la embajada necesitarás: pasaporte vigente, foto reciente, comprobante de pago de la tarifa, y confirmación de tu cita.' }] },
          { _type: 'block', _key: 'b4', style: 'h2', children: [{ _type: 'span', _key: 's4', text: 'El formulario DS-160' }] },
          { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'El DS-160 es el formulario de solicitud de visa. Debes completarlo en línea antes de tu cita. Te recomendamos tomarte tu tiempo y revisar cada respuesta.' }] },
          { _type: 'block', _key: 'b6', style: 'h2', children: [{ _type: 'span', _key: 's6', text: 'La entrevista' }] },
          { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'La entrevista es el paso más importante. Sé honesto, conciso y lleva documentos de soporte que demuestren tus vínculos con tu país.' }] },
        ],
        publishedAt: new Date().toISOString(),
        readingTime: 5,
        status: 'published',
      },
      {
        _type: 'post',
        title: '10 Errores que Debes Evitar en tu Entrevista de Visa',
        slug: { _type: 'slug', current: '10-errores-entrevista-visa' },
        excerpt: 'Aprende de los errores más comunes que cometen los solicitantes y cómo evitarlos.',
        author: { _type: 'reference', _ref: authorRef },
        category: { _type: 'reference', _ref: categoryRefs['consejos'] },
        tags: [
          { _type: 'reference', _ref: tagRefs['entrevista'], _key: 't1' },
        ],
        content: [
          { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'La entrevista de visa puede ser estresante, pero conocer los errores más comunes te ayudará a prepararte mejor.' }] },
          { _type: 'block', _key: 'b2', style: 'h2', children: [{ _type: 'span', _key: 's2', text: '1. No prepararse para las preguntas' }] },
          { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Muchos solicitantes llegan sin haber practicado sus respuestas. Prepárate para preguntas sobre tu trabajo, familia y motivo del viaje.' }] },
          { _type: 'block', _key: 'b4', style: 'h2', children: [{ _type: 'span', _key: 's4', text: '2. Llevar demasiados documentos' }] },
          { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Menos es más. Lleva solo los documentos esenciales y organizados. El oficial no tiene tiempo de revisar carpetas enormes.' }] },
        ],
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // Ayer
        readingTime: 4,
        status: 'published',
      },
      {
        _type: 'post',
        title: 'Cómo Llenar el Formulario DS-160 Paso a Paso',
        slug: { _type: 'slug', current: 'como-llenar-ds-160-paso-a-paso' },
        excerpt: 'Guía detallada para completar el formulario DS-160 sin errores.',
        author: { _type: 'reference', _ref: authorRef },
        category: { _type: 'reference', _ref: categoryRefs['visa-usa'] },
        tags: [
          { _type: 'reference', _ref: tagRefs['ds-160'], _key: 't1' },
          { _type: 'reference', _ref: tagRefs['documentos'], _key: 't2' },
        ],
        content: [
          { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'El formulario DS-160 es obligatorio para solicitar cualquier visa de no inmigrante a Estados Unidos. Aquí te explicamos cómo llenarlo correctamente.' }] },
          { _type: 'block', _key: 'b2', style: 'h2', children: [{ _type: 'span', _key: 's2', text: 'Antes de empezar' }] },
          { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Ten a la mano tu pasaporte, historial de viajes, información laboral y datos de contacto en USA si los tienes.' }] },
        ],
        publishedAt: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
        readingTime: 8,
        status: 'published',
      },
    ];

    for (const post of posts) {
      const existing = await client.fetch(
        `*[_type == "post" && slug.current == $slug][0]`,
        { slug: post.slug.current }
      );
      
      if (existing) {
        console.log(`   "${post.title.substring(0, 40)}..." ya existe`);
      } else {
        await client.create(post);
        console.log(`   ✅ "${post.title.substring(0, 40)}..." creado`);
      }
    }

    console.log('\n✅ Blog seeding completado!');
    console.log('\n🔗 Visita: http://localhost:3000/blog');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.statusCode === 403) {
      console.log('\n💡 El token no tiene permisos de escritura.');
      console.log('   Crea un token con permisos de "Editor" en Sanity.');
    }
  }
}

seedBlog();
