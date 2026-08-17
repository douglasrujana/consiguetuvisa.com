# ADR-001: Islands Architecture — Astro + Svelte 5 Runes + React

| Metadato | Valor |
| :--- | :--- |
| **Estado** | **Aceptado / En Producción** |
| **Fecha** | Agosto 2026 |
| **Fase SDLC** | `03_architecture/adrs` |
| **Contexto** | Stack de Frontend, Renderizado y Hidratación de Componentes |

---

## 1. Contexto y Problema
El proyecto requiere tres capacidades aparentemente contradictorias al mismo tiempo:
1. **SEO de nivel enterprise**: Contenido 100% indexable por buscadores, con tiempos de carga LCP ≤ 1.2 segundos en mobile.
2. **Interactividad rica y reactiva**: ChatBot IA en tiempo real, animaciones de scroll, formularios dinámicos y widgets de promoción (SpinWheel, Kiosko).
3. **Ecosistema de herramientas**: El CMS (Sanity Studio) requiere React. Los componentes interactivos ligeros son más eficientes en Svelte. Parte de la lógica de autenticación (Clerk) está atada a React.

Un SPA puro (React / Next.js) no es viable: sacrifica SEO y aumenta el TTI (Time to Interactive) drásticamente. Un sitio 100% estático no puede manejar la interactividad requerida.

---

## 2. Decisión de Arquitectura

Se adopta el patrón **Islands Architecture** implementado mediante **Astro** como orquestador de renderizado:

### 2.1 Reglas de Hidratación por Tipo de Componente:

| Tipo de Componente | Framework | Directiva de Hidratación | Razón |
| :--- | :---: | :---: | :--- |
| **Páginas, Layouts, Secciones SEO** | Astro (`.astro`) | Ninguna (HTML puro en servidor) | Máximo rendimiento y SEO |
| **Widgets interactivos ligeros** | Svelte 5 Runes (`.svelte`) | `client:visible` | Reactividad eficiente con bundle mínimo |
| **Sanity Studio Embebido** | React (`.tsx`) | `client:only="react"` | Compatibilidad obligatoria con SDK de Sanity |
| **Componentes de Auth (Clerk)** | React (`.tsx`) | `client:load` | SDK de Clerk opera exclusivamente en React |

### 2.2 Estrategia de ViewTransitions:
Se adopta el componente `<ViewTransitions />` de Astro para navegación fluida entre páginas sin recarga completa del browser. Toda la lógica de inicialización JavaScript (IntersectionObserver, animaciones) debe escuchar tanto `DOMContentLoaded` como `astro:page-load` para re-ejecutarse después de cada transición de página.

```typescript
// CORRECTO: Compatible con ViewTransitions
document.addEventListener('astro:page-load', initAnimations);
// INCORRECTO: Se ejecuta solo en la carga inicial
document.addEventListener('DOMContentLoaded', initAnimations);
```

---

## 3. Consecuencias

### Positivas:
* **Core Web Vitals Óptimos**: El HTML completo llega pre-renderizado desde el servidor; ningún framework de UI bloquea el First Contentful Paint.
* **Bundle del Cliente Reducido**: El JavaScript enviado al navegador contiene únicamente las islas interactivas solicitadas. El bundle de Sanity Studio (≈5MB) queda aislado en `sanity-studio.js` y solo se descarga al acceder a `/studio`.
* **Libertad de Stack**: Cada isla puede usar el framework óptimo para su caso de uso sin que los demás componentes se vean afectados.

### Neutrales / Trade-offs:
* Requiere disciplina al definir los límites de cada isla (qué se hidrata, cuándo y con qué directiva).
* El estado compartido entre islas de distintos frameworks (Svelte ↔ React) debe gestionarse mediante el DOM (Custom Events) o una store reactiva compartida (Nano Stores).
