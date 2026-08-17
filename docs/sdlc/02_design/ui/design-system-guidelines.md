# Design System

## Filosofía

El proyecto sigue un enfoque **Utility-First** con capas bien definidas:

| Capa | Porcentaje | Uso |
|------|------------|-----|
| Design Tokens | 10% | Variables CSS (colores, espaciados) |
| Tailwind | 60% | Utilidades, layout, responsive |
| Shadcn/UI | 20% | Componentes reutilizables |
| CSS Puro | 10% | Casos especiales, animaciones |

## Capas

### 1. Design Tokens (CSS Variables)

```css
/* design-system/global/tokens.css */
:root {
  --color-primary: #...;
  --color-secondary: #...;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --radius-md: 0.5rem;
}
```

Todos los estilos DEBEN depender de estos tokens.

### 2. Tailwind (Utility-First)

```html
<div class="flex items-center gap-4 p-4 bg-primary rounded-md">
  ...
</div>
```

Usado para: Layout, Grid, Flexbox, Responsive, Estados.

### 3. Shadcn/UI (Componentes)

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
</script>

<Button variant="primary">Click me</Button>
```

Usado para: Buttons, Inputs, Cards, Modals, Dropdowns.

### 4. CSS Puro (Casos Especiales)

```css
/* Solo para landing pages aisladas o efectos avanzados */
.sale-header__title {
  animation: fadeIn 0.5s ease-out;
}
```

## Temas

El sistema soporta múltiples temas:

```
design-system/global/themes/
├── light.css
├── dark.css
├── navidad.css
├── carnaval.css
└── independencia.css
```

Cambiar tema:
```javascript
document.documentElement.setAttribute("data-global-theme", "navidad");
```

## Cuándo Usar Cada Tecnología

### Astro (.astro) - 90% del sitio
- Home, Landing pages, Blog
- Contenido estático
- SEO-critical pages
- Sanity CMS blocks

### Svelte (.svelte) - 10% del sitio
- Formularios interactivos
- Wizards/Steppers
- Modals, Dropdowns
- Chat widget
- Componentes con estado

## Estructura de Archivos

```
design-system/
├── global/
│   ├── tokens.css        # Variables CSS
│   ├── components.css    # Componentes base
│   ├── utilities.css     # Utilidades custom
│   ├── animations.css    # Animaciones
│   └── themes/           # Temas
│
└── landing-pages/        # Estilos específicos por landing
    ├── oferta-blackfriday/
    ├── oferta-navidad/
    └── promo-urgente/
```

## Best Practices

### DO ✅
- Usar tokens para colores y espaciados
- Preferir Tailwind sobre CSS custom
- Componentes Shadcn para UI común
- Scoped styles en Svelte

### DON'T ❌
- Hardcodear colores (`#ff0000`)
- CSS global sin scope
- Duplicar estilos entre componentes
- Mezclar BEM con Tailwind
