✅ 1. Filosofía del Diseño Moderno

Tu arquitectura debe cumplir 5 metas:
1.1. Atomic + Utility First (Tailwind)
Tailwind ya te da las utilidades, tú solo definiste tokens, componentes y temas.
1.2. Design System = Single Source of Truth
Todos los colores, tamaños, fuentes, sombras se definen una sola vez en tokens.
1.3. Component Driven
Botones, modales, inputs, cards → componentes Svelte, no archivos CSS individuales.
1.4. Maximum Reusability
Nada de escribir CSS “a mano” salvo muy casos especiales → usar @layer components.
1.5. Anti Vendor Locking



## ✅ Capa 1 — Design Tokens (CSS variables) – 10%
Son únicamente:
Colores
Tipografía
Espaciados
Z-index
Sombras
Radios
Bordes
Temas (light/dark/navidad/carnaval/promos)
📌 Todos los estilos del proyecto DEBEN depender de estos tokens.

✅ Capa 2 — Tailwind (Utility-first) – 60%
Tailwind es tu motor principal.
Aquí haces:
Layout
Grid
Flexbox
Tipografías
Colores basados en tokens
Responsive
Hover/focus
Estado dinámico
Animaciones simples
Bordes, radii, sombras

✅ Capa 3 — Shadcn/UI (Component Library) – 20%
Shadcn es tu biblioteca de componentes:
Buttons
Inputs
Cards
Navbars
Modals
Dropdowns
Menús
Particularmente perfecto para Svelte (tu stack)
Shadcn usa Tailwind internamente y sigue un design system basado en tokens.

📌 Se usa para:
componentes repetibles, uniformes, accesibles y de alto nivel.
Porcentaje recomendado: 20% de toda tu UI.
Shadcn te evita inventarte un diseño desde cero.

✅ Capa 4 — CSS Puro (ring pelado) + Svelte scoped – 10%
CSS puro sí se usa, pero con intención:
Cuándo usarlo:
Estilos aislados para una sales page
Experimentos rápidos
Efectos avanzados
Animaciones complejas
Overrides precisos
Cuando Tailwind se queda corto
Dónde:
En archivos .css locales o
Dentro del <style scoped> de Svelte
Porcentaje recomendado:
5–10% del proyecto total.


## ✔ BEM (opcional, recomendado para Sales Pages aisladas)
Cuando quieras estilos muy controlados, sin Tailwind, por ejemplo en una promo "burro suelto":

Ejemplo:
.sale-header__title { … }
.sale-header__subtitle { … }
.sale-card__button { … }

Úsalo en:
Landing pages independientes
Micrositios
Funnels específicos
Páginas con estilo único

## ✔ Sass (opcional pero útil)
Se usa para:
Mixins
Funciones
Nesting elegante
Better organization
Temas complejos

Solo úsalo si lo necesitas.
Tailwind normalmente elimina el 90% de las razones para usar Sass.
Porcentaje recomendado:
BEM → 2–3%
SASS → 5%

## ✔ CSS-in-JS (opcional pero útil)
UnoCSS

## ✔ Tailwind CSS (opcional pero útil)
document.documentElement.setAttribute("data-global-theme", "navidad");


Cada sección usa Svelte Components con Tailwind:

✅ 9. Workﬂow profesional
9.1. Figma → Tokens → Tailwind

Figma define:
colores
espaciados
tipografías
sombras
radios
Luego se exporta a tokens.
9.2. Tailwind consume tokens
Tailwind no define nada, solo usa tus variables.
9.3. Componentes UI en Svelte
Cada pieza se diseña una sola vez.
9.4. Astro renderiza páginas
Astro orquesta contenido + UI.
9.5. Sanity edita copy + imágenes

Mantienes control total del contenido.


.

🎯 Para tu sitio “consiguetuvisa.com” la combinación ideal es:
1. 90% del sitio: .astro

Home

Sales pages

Landing pages

Blog

Secciones de contenido

Sanity CMS content blocks

Astro = performance + SEO + cero JS = perfecto para vender servicios

2. 10% del sitio: .svelte

Solo para cosas que requieren:

interacción

lógica del lado del cliente

UX inmediata

Ej

🎯 ¿Cuándo usar Svelte components?

Para toda la interactividad real:

Formularios avanzados

Stepper de visa

Calculadoras

Wizards

Dropdowns

Modals

Carousels

Inputs dinámicos

Selects con autocompletar

Datepickers

Todo eso → .svelte


svelte

🎯 ¿Cuándo NO usar Svelte y usar solo Astro?

Secciones estáticas

Contenido CMS

Hero

Testimonials

Pricing

CTA

FAQ

Header estático

Footer

Todo eso → .astro