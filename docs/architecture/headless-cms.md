# Arquitectura Headless CMS

## Resumen

El sitio usa **Sanity CMS** como headless CMS con un sistema de fallback para garantizar disponibilidad.

## Flujo de Carga de Páginas

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST: GET /                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              getHomePage() - page.service.ts                │
│                                                             │
│  1. Intenta cargar desde Sanity (siteSettings.homePage)     │
│  2. Si falla, intenta buscar page con slug "home"           │
│  3. Si falla, retorna fallback estático                     │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────┐
│   Sanity OK         │     │   Sanity FALLA              │
│                     │     │                             │
│   BlockRenderer     │     │   Componentes estáticos     │
│   renderiza         │     │   Hero, Benefits, etc.      │
│   sections[]        │     │   (src/components/home/)    │
└─────────────────────┘     └─────────────────────────────┘
```

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/lib/sanity/page.service.ts` | Servicio con fallback |
| `src/pages/index.astro` | Home dinámico/estático |
| `src/components/blocks/BlockRenderer.astro` | Renderiza secciones de Sanity |
| `src/components/home/*.astro` | Componentes fallback estáticos |
| `sanity/schemas/documents/siteSettings.ts` | Config del sitio en Sanity |
| `sanity/schemas/documents/page.ts` | Schema de páginas |

## Configuración en Sanity

### 1. Crear siteSettings
En Sanity Studio (`/studio`):
1. Ir a "Configuración del Sitio"
2. Crear documento
3. Seleccionar "Página de Inicio" → referencia a una page

### 2. Crear página Home
1. Ir a "Landing Page"
2. Crear página con slug "home"
3. Agregar secciones (hero, features, testimonials, etc.)

## Fallback

Si Sanity no está disponible o no hay página configurada:

```typescript
// src/lib/sanity/page.service.ts
function getFallbackHomePage(): SanityPage {
  return {
    _id: 'fallback-home',
    title: 'ConsigueTuVisa',
    sections: [
      { _type: 'hero', title: 'Tu Visa, Nuestra Misión', ... },
      { _type: 'features', ... },
      // ...
    ]
  };
}
```

## Agregar Nuevas Secciones

### 1. Crear schema en Sanity
```typescript
// sanity/schemas/blocks/newSection.ts
export default {
  name: 'newSection',
  type: 'object',
  fields: [...]
}
```

### 2. Registrar en schemas/index.ts
```typescript
import newSection from './blocks/newSection';
export const schemaTypes = [..., newSection];
```

### 3. Agregar a page.ts
```typescript
sections: {
  of: [..., { type: 'newSection' }]
}
```

### 4. Crear componente Astro
```astro
// src/components/blocks/NewSection.astro
---
const { title, ... } = Astro.props;
---
<section>...</section>
```

### 5. Registrar en BlockRenderer
```typescript
const blockComponents = {
  ...,
  newSection: NewSection,
};
```

## Variables de Entorno

```env
SANITY_PROJECT_ID=zvbggttz
SANITY_DATASET=production
SANITY_API_TOKEN=sk-xxx  # Solo para mutaciones
```

## Beneficios

1. **Resiliencia**: Si Sanity cae, el sitio sigue funcionando
2. **Editable**: Contenido editable desde Sanity Studio
3. **SEO**: Páginas estáticas generadas en build time
4. **Flexibilidad**: Fácil agregar nuevas secciones
