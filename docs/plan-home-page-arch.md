
## 🔥 Arquitectura Frontend

```
/src
 ├─/components
 │    ├─ ui/ (shadcn-svelte adaptado)
 │    ├─ svelte/ (islas reactivas)
 │    └─ astro/ (estructura)
 ├─/layouts
 ├─/pages
 │    ├─ index.astro
 │    ├─ visas/[slug].astro
 │    └─ contacto.astro
 ├─/lib
 │    ├─ sanity/
 │    ├─ prisma/
 │    └─ utils/
 └─/styles
      ├─ tokens.css
      ├─ theme.css
      └─ globals.css
```

---

# 🗄️ **Rol: Diseñador de Base de Datos Senior**

## Tabla Leads

```
Lead {
  id           String @id @default(cuid())
  name         String
  email        String?
  phone        String
  visaType     String
  message      String?
  source       String (whatsapp, form, landing...)
  createdAt    DateTime @default(now())
}
```

## Tabla Testimonios

```
Testimonial {
  id        String @id @default(cuid())
  name      String
  videoUrl  String?
  imageUrl  String?
  text      String
}
```

---

# 🧪 **Rol: QA Senior**

## Puntos críticos a testear

* Formularios → validación Zod
* Integración con Bitrix24
* SSR correcto en Astro
* Links de WhatsApp
* Pixel Meta
* Performance Lighthouse (mínimo 95)

---

# 🔐 **Rol: Pentesting / Seguridad Senior**

* Sanitizar inputs
* CSRF en formularios server-side
* HTTPS obligatorio
* Rate limiting en endpoints API
* CORS estrictos
* Revisión diaria de logs en Vercel
* Seguridad en Webhooks de Bitrix24

---

# 🚀 **Rol: DevOps Senior**

## Entorno

* Vercel
* Variables de entorno seguras
* Previews automáticos
* Integración con GitHub
* Backups automáticos PostgreSQL
* CDN Edge para assets

---

# 📈 **Rol: Marketing Digital / Embudos Senior**

## Embudo recomendado

1. Tráfico Meta Ads
2. Landing específica (Astro + Sanity)
3. CTA → WhatsApp / Form
4. Lead a Bitrix24
5. Nurturing por WhatsApp + Email
6. Venta: asesoría → pago
7. Seguimiento → Testimonio

## SEO On-page

* Keywords: visa USA Ecuador, visa turismo Ecuador, conseguir visa USA
* Rich snippets (FAQ + servicio)
* Blog con contenido evergreen

---

# 🎯 ¿Quieres que prepare la **arquitectura del Design System completo** (tokens, escalas, variables, componentes shadcn adaptados y Tailwind 4)?

Puedo generarlo **listo para copiar en tu proyecto Astro**.
