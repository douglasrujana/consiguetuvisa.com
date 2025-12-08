Perfecto, Douglas.
Aquí tienes el documento **completo en Markdown**, organizado por roles senior, con ideación, estrategia, arquitectura y checklist para el *home page* de **consiguetuvisa.com**.

---

# 🏛️ **Documento Estratégico y Técnico — consiguituvisa.com**

**Proyecto:** Plataforma de asesoría profesional para visas de turismo
**Mercado:** Ecuador
**Branding:** Profesional, confiable, limpio — estilo Jony Ive
**Stack:** Astro 5 + Svelte 5 + Tailwind 4 + shadcn-svelte + Sanity + Bitrix24 + WhatsApp
**Hosting:** Vercel

---

# ✅ **CHECKLIST INICIAL DEL HOME PAGE**

* [ ] **Hero** con mensaje claro, credibilidad y CTA a WhatsApp + botón “Evaluación gratuita”.
* [ ] **Tipos de visas** (EE.UU, Canadá, México, UE, UK, Schengen Premium).
* [ ] **Testimonios verificables** (video + screenshot + rating).
* [ ] **Proceso paso a paso** (3–5 pasos: Diagnóstico → Documentos → Cita → Acompañamiento).
* [ ] **Sección de por qué somos confiables** (autoridad, experiencia, cifras).
* [ ] **Preguntas frecuentes (FAQ)**.
* [ ] **Formulario de contacto rápido** integrado con Bitrix24.
* [ ] **WhatsApp flotante** con Smart Routing.
* [ ] **Footer completo** (legal, compañía, contacto, redes, aviso de privacidad).

---

# =====================================================

# **1. FASE DE IDEACIÓN INICIAL**

# =====================================================

---

# 🎯 **Rol: Ingeniero de Producto Senior**

## Objetivo Principal

Convertir tráfico frío → en leads → en asesorías pagadas para visas de turismo.

## KPI principales:

* % de clics en CTA del Hero
* % de formularios completados
* % de conversiones desde WhatsApp
* Tiempo en página
* Costo por lead

## Mensaje clave:

> “Te ayudamos a conseguir tu visa de turismo sin estrés, sin errores y con asesoría personalizada.”

## Estructura del Home Page (definitiva)

1. **Hero**

   * Claim: *“Tu Visa de Turismo Sin Complicaciones — Acompañamiento Experto Paso a Paso.”*
   * Subclaim: *EE.UU | Canadá | México | Europa | Reino Unido | Schengen Premium*
   * CTA doble: **“Evaluación gratuita”** + **WhatsApp**

2. **Beneficios rápidos (3–4 íconos)**

   * 97% de clientes satisfechos
   * Asistencia en todo el proceso
   * Revisión profesional de documentos
   * Acompañamiento hasta la cita

3. **Tipos de visas (tarjetas)**

   * Visa EE.UU
   * Visa Canadá
   * Visa México
   * Visa Schengen
   * Visa UK
   * “Escoge tu destino → Agenda asesoría”

4. **Testimonios reales (videos + screenshots)**

   * “Casos de éxito verificados”
   * Pruebas sociales: aprobaciones, whatsapp reales

5. **Proceso paso a paso**

   1. Evaluación de caso
   2. Recolección de documentos
   3. Llenado de formulario DS-160 / equivalente
   4. Agendamiento
   5. Preparación para la entrevista

6. **Por qué confiar en nosotros**

   * Años de experiencia
   * Cifras
   * Equipo certificado
   * Atención personalizada

7. **FAQ**

8. **Formulario de contacto + WhatsApp**

9. **Footer**

---

# ✍️ **Rol: Copywriter Senior**

## Tono

* Claro
* Profesional
* Cálido
* Sin tecnicismos
* Directo a conversión

## Mensaje base (Hero)

> **Consigue tu visa de turismo sin errores, sin estrés y con acompañamiento profesional en cada paso.**
> Estados Unidos, Europa, Canadá, México, Reino Unido y más.

### Microcopy de confianza

* “Miles de ecuatorianos han confiado en nuestro servicio.”
* “Tu trámite, en manos de expertos.”

### CTA

* **Evaluación gratuita → 5 minutos**
* **Atención por WhatsApp ahora**

---

# 🎨 **Rol: Diseñador Web / UX Senior**

## Estética

* Minimalista tipo Jony Ive
* Alto contraste, limpio
* Mucho espacio en blanco
* Montserrat como tipografía principal
* Uso ligero de sombras

## Colores recomendados

* Azul confianza (#2D5BE3)
* Azul claro (#EEF3FF)
* Blanco (#FFFFFF)
* Gris neutro (#F7F7F7)
* Verde WhatsApp (#25D366)

## Componentes UI

* botónes shadcn adaptados a Svelte
* tarjetas limpias con borde suave
* inputs grandes y accesibles
* grids 12-columnas

## Comportamiento UX

* Hero full width
* Secciones moduladas
* Testimonios tipo slider
* Menú superior sticky

---

# =====================================================

# **2. FASE DE ARQUITECTURA TÉCNICA Y DE DISEÑO**

# =====================================================

---

# 🏗️ **Rol: Arquitecto / Desarrollador Fullstack Senior**

## 🔧 Stack Técnico Definitivo

* **Astro 5** → base del proyecto, páginas estáticas/SSR
* **Svelte 5 (islas)** → formularios reactivos, sliders, wizard
* **Tailwind 4** → estilo base
* **shadcn-svelte** → componente UI enterprise
* **Sanity CMS** → contenido editable
* **Prisma** → ORM
* **SQLite o PostgreSQL** → base de datos
* **Bitrix24 CRM** → lead management
* **WhatsApp Cloud API** → contacto
* **Meta Pixel** → tracking
* **Vercel** → hosting

---
