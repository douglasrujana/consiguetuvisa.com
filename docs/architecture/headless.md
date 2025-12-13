Sí, es totalmente posible. El patrón se llama "Headless CMS + Theme System". Te explico la arquitectura:

Arquitectura Propuesta
┌─────────────────────────────────────────────────────────────┐
│                        SANITY CMS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Themes    │  │   Pages     │  │   Sections/Blocks   │  │
│  │  - default  │  │  - home     │  │  - Hero             │  │
│  │  - minimal  │  │  - about    │  │  - Features         │  │
│  │  - premium  │  │  - contact  │  │  - Testimonials     │  │
│  └─────────────┘  └─────────────┘  │  - CTA              │  │
│                                    │  - FAQ              │  │
│                                    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ASTRO FRONTEND                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Theme Loader / Resolver                │    │
│  │   - Lee theme activo desde Sanity                   │    │
│  │   - Carga componentes del theme                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │                    /themes/                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │ default/ │  │ minimal/ │  │    premium/      │   │    │
│  │  │ Hero     │  │ Hero     │  │    Hero          │   │    │
│  │  │ Features │  │ Features │  │    Features      │   │    │
│  │  │ ...      │  │ ...      │  │    ...           │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
Estructura de Archivos
src/
├── themes/
│   ├── default/
│   │   ├── components/
│   │   │   ├── Hero.astro
│   │   │   ├── Features.astro
│   │   │   ├── Testimonials.astro
│   │   │   └── CTA.astro
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro
│   │   └── theme.config.ts
│   │
│   ├── minimal/
│   │   ├── components/
│   │   │   ├── Hero.astro
│   │   │   └── ...
│   │   └── theme.config.ts
│   │
│   └── index.ts  # Theme registry
│
├── lib/
│   ├── theme-loader.ts    # Carga theme desde Sanity
│   └── section-renderer.ts # Renderiza secciones dinámicas
│
└── pages/
    └── [...slug].astro    # Página dinámica
Schemas Sanity

// sanity/schemas/theme.ts
export default {
  name: 'siteSettings',
  type: 'document',
  fields: [
    { name: 'activeTheme', type: 'string', options: { list: ['default', 'minimal', 'premium'] } },
    { name: 'logo', type: 'image' },
    { name: 'colors', type: 'object', fields: [...] },
  ]
}

// sanity/schemas/page.ts
export default {
  name: 'page',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug' },
    { name: 'sections', type: 'array', of: [
      { type: 'hero' },
      { type: 'features' },
      { type: 'testimonials' },
      { type: 'cta' },
      { type: 'faq' },
    ]}
  ]
}

// sanity/schemas/sections/hero.ts
export default {
  name: 'hero',
  type: 'object',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'subtitle', type: 'text' },
    { name: 'image', type: 'image' },
    { name: 'cta', type: 'object', fields: [
      { name: 'text', type: 'string' },
      { name: 'link', type: 'string' },
    ]}
  ]
}
¿Quieres que cree una spec detallada para implementar este sistema de themes? Puedo documentarlo en .kiro/specs/ con tareas específicas.

Credits used: 1.23
Elapsed time: 41s
Revert

## Actual
Lo que YA tienes ✅
BlockRenderer - Ya renderiza secciones dinámicamente desde Sanity
Sanity schemas - Ya tienes page.ts con secciones (hero, features, testimonials, etc.)
Componentes blocks - src/components/blocks/ con Hero, Features, CTA, FAQ, etc.
Componentes home - src/components/home/ con versiones específicas del home
Lo que FALTA para themes 🔄
ACTUAL                              →  PROPUESTA
─────────────────────────────────────────────────────────────
src/components/blocks/Hero.astro    →  src/themes/default/blocks/Hero.astro
src/components/home/Hero.astro      →  src/themes/default/home/Hero.astro
                                    →  src/themes/minimal/blocks/Hero.astro
                                    →  src/themes/premium/blocks/Hero.astro

index.astro (hardcoded)             →  index.astro (dinámico desde Sanity)
Arquitectura Propuesta (Adaptada)
src/
├── themes/
│   ├── default/                    # Theme actual (migrar componentes)
│   │   ├── blocks/                 # ← mover de src/components/blocks/
│   │   ├── home/                   # ← mover de src/components/home/
│   │   ├── global/                 # ← mover de src/components/global/
│   │   └── theme.config.ts
│   │
│   ├── minimal/                    # Nuevo theme
│   │   ├── blocks/
│   │   └── theme.config.ts
│   │
│   └── registry.ts                 # Registro de themes
│
├── components/                     # Componentes compartidos (no theme-specific)
│   ├── ui/                         # shadcn, buttons, etc.
│   ├── chat/                       # ChatWidget
│   ├── auth/                       # Login, Register
│   └── admin/                      # Admin components
│
├── lib/
│   └── theme-loader.ts             # Carga theme activo desde Sanity
│
└── pages/
    ├── index.astro                 # Dinámico: carga home desde Sanity
    └── [...slug].astro             # Páginas dinámicas
Sanity: Agregar siteSettings
// sanity/schemas/documents/siteSettings.ts
export default {
  name: 'siteSettings',
  type: 'document',
  fields: [
    { name: 'activeTheme', type: 'string', 
      options: { list: ['default', 'minimal', 'premium'] } },
    { name: 'homePage', type: 'reference', to: [{ type: 'page' }] },
  ]
}

Migración Mínima
El cambio más simple sería:

Crear src/themes/default/ y mover componentes actuales
Agregar siteSettings a Sanity con activeTheme
Modificar index.astro para cargar desde Sanity
Crear theme-loader.ts que resuelve componentes según theme activo
¿Quieres que cree una spec formal en .kiro/specs/theme-system/ con tareas detalladas para implementar esto?

Credits used: 3.35
Elapsed time: 1m 20s
Revert

Claude Opus 4.5
Autopilot

## 
Buena pregunta. Déjame explicarte el propósito real y cuándo tiene sentido:

¿Cuándo SÍ tiene sentido múltiples themes?
| Caso de Uso | Ejemplo | |-------------|---------| | SaaS multi-tenant | Shopify, WordPress.com - cada cliente elige su theme | | Agencias | Una agencia que vende el mismo producto a múltiples clientes con diferentes diseños | | A/B Testing | Probar 2 diseños diferentes en producción | | White-label | Mismo producto, diferentes marcas |

¿Cuándo NO tiene sentido?
| Caso de Uso | Razón | |-------------|-------| | Un solo sitio | ConsigueTuVisa.com - solo necesitas UN diseño | | Rediseño completo | No necesitas "themes", solo reemplazas componentes |

Para TU caso (ConsigueTuVisa)
No necesitas default/minimal/premium. Lo que necesitas es:

Arquitectura Simple: "Sanity-Driven Pages"
┌─────────────────────────────────────────┐
│              SANITY CMS                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Pages     │  │   Sections      │   │
│  │  - home     │  │  - hero         │   │
│  │  - about    │  │  - features     │   │
│  │  - contact  │  │  - testimonials │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            ASTRO FRONTEND               │
│                                         │
│   src/components/blocks/                │
│   ├── Hero.astro      ← Diseño actual   │
│   ├── Features.astro                    │
│   └── ...                               │
│                                         │
│   BlockRenderer.astro                   │
│   └── Renderiza según _type de Sanity   │
└─────────────────────────────────────────┘
Flujo para Rediseño Completo
Día 1: Quieres cambiar TODO el diseño

1. Creas nuevos componentes (o modificas los existentes):
   src/components/blocks/Hero.astro  ← Cambias el diseño aquí

2. El schema de Sanity NO cambia (o agregas nuevos campos si necesitas)

3. Deploy → Nuevo diseño en producción
No necesitas:

Carpeta themes/
Sistema de selección de themes
Complejidad adicional
Lo que SÍ te recomiendo implementar
1. Hacer index.astro dinámico (cargar desde Sanity)
---
// src/pages/index.astro
import Layout from '@components/global/Layout.astro';
import BlockRenderer from '@components/blocks/BlockRenderer.astro';
import { getHomePage } from '@lib/sanity';

const page = await getHomePage(); // Carga secciones desde Sanity
---

<Layout title={page.seo?.title || 'ConsigueTuVisa'}>
  <BlockRenderer sections={page.sections} />
</Layout>
2. Agregar homePage a siteSettings en Sanity
// sanity/schemas/documents/siteSettings.ts
{
  name: 'siteSettings',
  fields: [
    { name: 'siteName', type: 'string' },
    { name: 'homePage', type: 'reference', to: [{ type: 'page' }] },
    { name: 'logo', type: 'image' },
    { name: 'contactEmail', type: 'string' },
  ]
}
3. Flujo de rediseño

ANTES (hardcoded):
index.astro → importa Hero, Benefits, etc. directamente

DESPUÉS (dinámico):
index.astro → carga page desde Sanity → BlockRenderer renderiza secciones

REDISEÑO:
1. Modificas src/components/blocks/Hero.astro
2. Deploy
3. Listo - el contenido sigue viniendo de Sanity
Resumen
| Pregunta | Respuesta | |----------|-----------| | ¿Necesitas múltiples themes? | No - solo tienes un sitio | | ¿Qué necesitas? | Hacer index.astro dinámico desde Sanity | | ¿Cómo rediseñas? | Modificas los componentes en src/components/blocks/ | | ¿El contenido se pierde? | No - el contenido está en Sanity, solo cambias la presentación |

¿Quieres que implemente el index.astro dinámico y el siteSettings en Sanity?

Credits used: 1.24
Elapsed time: 50s
Revert


Claude Opus 4.5
Autopilot

## Fallback
Excelente pregunta. Sí, hay varios patrones para manejar esto:

Patrones de Fallback para CMS Headless
1. Static Generation + ISR (Recomendado para Astro)
┌─────────────────────────────────────────────────────────────┐
│                      BUILD TIME                             │
│  Astro genera HTML estático desde Sanity                    │
│  → dist/index.html (contenido "horneado")                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      RUNTIME                                │
│  Usuario visita → Vercel sirve HTML estático                │
│  Sanity caído? → No importa, el HTML ya existe              │
└─────────────────────────────────────────────────────────────┘
Ventaja: Si Sanity cae, el sitio sigue funcionando con la última versión.

2. Cache Layer (Redis/Vercel KV)
Request → Cache existe? → SÍ → Servir desde cache
                │
                NO
                ↓
         Sanity disponible? → SÍ → Fetch + Guardar en cache
                │
                NO
                ↓
         Servir fallback estático
3. Fallback Estático Local
// src/lib/sanity-with-fallback.ts
import { sanityClient } from './sanity';
import fallbackHome from '@data/fallback-home.json';

export async function getHomePage() {
  try {
    const page = await sanityClient.fetch(QUERY, {}, { 
      timeout: 5000 // 5 segundos máximo
    });
    
    if (!page) throw new Error('No data');
    return page;
    
  } catch (error) {
    console.warn('[Sanity] Fallback activado:', error.message);
    return fallbackHome; // JSON local con contenido de emergencia
  }
}

Implementación Recomendada para ConsigueTuVisa
Estrategia: Static Build + Fallback JSON
src/
├── data/
│   └── fallback/
│       ├── home.json        # Copia del contenido del home
│       └── site-settings.json
│
├── lib/
│   └── sanity-client.ts     # Cliente con fallback
Código
// src/lib/sanity-client.ts
import { createClient } from '@sanity/client';
import fallbackHome from '@data/fallback/home.json';

const client = createClient({
  projectId: 'xxx',
  dataset: 'production',
  useCdn: true, // CDN = más rápido y resiliente
});

export async function getHomePage() {
  try {
    const data = await client.fetch(
      `*[_type == "page" && slug.current == "home"][0]{
        title,
        seo,
        sections[]{ ... }
      }`,
      {},
      { next: { revalidate: 60 } } // Cache 60 segundos
    );
    
    if (!data?.sections?.length) {
      throw new Error('Empty response');
    }
    
    return data;
  } catch (error) {
    console.error('[Sanity Error]', error);
    return fallbackHome;
  }
}
Fallback JSON
// src/data/fallback/home.json
{
  "title": "ConsigueTuVisa - Asesoría de Visas",
  "sections": [
    {
      "_type": "hero",
      "title": "Tu Visa, Nuestra Misión",
      "subtitle": "Asesoría profesional para trámites de visa",
      "cta": { "text": "Contáctanos", "link": "/contacto" }
    },
    {
      "_type": "features",
      "items": [...]
    }
  ]
}
Script para Actualizar Fallback
// scripts/update-fallback.ts
// Ejecutar después de cada cambio importante en Sanity

import { sanityClient } from '../src/lib/sanity';
import fs from 'fs';

async function updateFallback() {
  const home = await sanityClient.fetch(`*[_type == "page" && slug.current == "home"][0]`);
  fs.writeFileSync('src/data/fallback/home.json', JSON.stringify(home, null, 2));
  console.log('✓ Fallback actualizado');
}

updateFallback();
Resumen de Estrategias
| Estrategia | Complejidad | Resiliencia | Frescura | |------------|-------------|-------------|----------| | Static Build (Astro default) | Baja | Alta | Build time | | Fallback JSON | Baja | Alta | Manual | | Cache (Redis/KV) | Media | Alta | Configurable | | ISR (Vercel) | Media | Alta | Revalidación |

Para ConsigueTuVisa recomiendo:
Astro Static Build - Ya lo tienes, el HTML se genera en build
Fallback JSON - Para casos edge donde necesites SSR
Sanity CDN - useCdn: true para mejor disponibilidad
¿Quieres que implemente el sistema de fallback con el JSON local?

Credits used: 1.29
Elapsed time: 47s

## Mejor opción: 
┌────────────────────────────────────────────────────────┐
│  1. BUILD TIME (pnpm build)                            │
│     Astro genera HTML estático desde Sanity            │
│     → Si Sanity cae después, NO importa                │
│     → El sitio ya está "horneado"                      │
└────────────────────────────────────────────────────────┘
                         +
┌────────────────────────────────────────────────────────┐
│  2. FALLBACK JSON (para páginas SSR/dinámicas)         │
│     Solo si usas server-side rendering                 │
│     → Chat, dashboard, APIs                            │
└────────────────────────────────────────────────────────┘



