# Product Requirements Document (PRD v2.0)
## Ecosistema Integral ConsigueTuVisa: Adquisición de Visas + Club de Viajes VIP + Back-Office ERP

| Metadato | Valor |
| :--- | :--- |
| **Versión del Documento** | **2.0.0** |
| **Estado** | **Aprobado / En Implementación** |
| **Fase SDLC** | `00_product` (Product Management) |
| **Propietario del Producto** | Product Owner & Lead Solutions Architect |
| **Público Objetivo** | Equipo de Ingeniería, Operaciones de Agencia, Dirección Ejecutiva |
| **Fecha de Aprobación** | Agosto 2026 |

---

## 1. 🌟 Resumen Ejecutivo y Tesis de Negocio

### 1.1 El Problema del Mercado
Las agencias de asesoría migratoria tradicionales operan bajo un modelo transaccional miope: adquieren clientes a un **Costo de Adquisición (CAC)** elevado, cobran una tarifa única por el llenado de formularios consulares (ej. DS-160) y **pierden al cliente para siempre una vez aprobada la visa**.

### 1.2 La Oportunidad y el Modelo Flywheel
Una persona que solicita una visa de turismo y califica exitosamente posee dos atributos de altísimo valor comercial:
1. **Solvencia económica verificada** (ingresos estables, estados de cuenta, arraigo).
2. **Intención inmediata de viajar y gastar en turismo**.

**PRD v2.0 define el ecosistema digital que capitaliza este ciclo de vida completo:**

```
               ┌──────────────────────────────────────────────┐
               │         1. GANCHO DE ADQUISICIÓN (TOFU)       │
               │  consiguetuvisa.com (Asesoría de Visas, SEO) │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │          2. GENERACIÓN DE CONFIANZA          │
               │  Trámite Exitoso de Visa + Calificación IA   │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │       3. MONETIZACIÓN RECURRENTE (BOFU)      │
               │      PORTAL VIP CLUB (Agencia de Viajes)     │
               │  Vuelos, Paquetes, Cruceros, Trenes, Hoteles │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         4. BACK-OFFICE OPERATIVO             │
               │  erp_worldclass_v2 (SD, FICO, MDM, HCM, EAM) │
               └──────────────────────────────────────────────┘
```

---

## 2. 👥 Arquetipos de Usuario (User Personas)

### Persona A: El Solicitante de Visa (Top of Funnel Lead)
* **Perfil**: Profesional o comerciante de 25-55 años con planes de vacacionar en EE.UU., Canadá o Europa.
* **Dolores**: Miedo a cometer errores en el formulario, temor a la entrevista consular, falta de tiempo.
* **Interacción**: Entra por SEO/Campañas en `consiguetuvisa.com`, consulta con el ChatBot IA, agenda evaluación gratuita y se registra.

### Persona B: El Miembro VIP Travel Club (Cliente de Alto LTV)
* **Perfil**: Cliente con visa aprobada o viajero frecuente que adquiere la membresía VIP.
* **Deseos**: Acceso a tarifas exclusivas de vuelos, paquetes aéreos a medida, cruceros por el Caribe/Mediterráneo, trenes en Europa y atención de un Concierge de viajes 24/7 sin intermediarios masivos.
* **Interacción**: Ingresa a `/portal` o `/vip`, solicita cotizaciones a su asesor asignado y consulta su bóveda de documentos.

### Persona C: El Asesor de la Agencia (Operativo / Staff)
* **Perfil**: Asesor de viajes y trámites migratorios.
* **Necesidades**: Pipeline visual de solicitantes (Kanban), historial de llamadas/citas, generador de enlaces de pago y acceso a plantillas DS-160.
* **Interacción**: Opera dentro del módulo `10_sd` y `05_mdm` del ERP.

### Persona D: El Administrador General / Dirección
* **Perfil**: Director de Operaciones y Finanzas.
* **Necesidades**: Visibilidad en tiempo real de ingresos por visas vs. comisiones de paquetes turísticos, auditoría de asesores y rendimiento de campañas.
* **Interacción**: Dashboards `13_analytics` y `11_fico` del ERP + Panel `/admin` de la web.

---

## 3. 🏛️ Los Tres Pilares del Producto

```
                                 ECOSISTEMA DIGITAL
    ┌─────────────────────────────────┬─────────────────────────────────┐
    │                                 │                                 │
    ▼                                 ▼                                 ▼
[ PILAR 1: FRONT PÚBLICO ]    [ PILAR 2: PORTAL VIP ]      [ PILAR 3: ERP BACK-OFFICE ]
• Portal consiguetuvisa.com   • Catálogo privado de viajes • Motor SD (Ventas & Leads)
• Motor de Visas & Landings   • Concierge personal 24/7    • Motor FICO (Comisiones & Pagos)
• ChatBot Calificador (RAG)   • Bóveda de Documentos       • Motor MDM (Business Partners)
• Deep Health Observability   • Cotizador de Vuelos/Tours  • Motor HCM & EAM (Asesores)
```

### 3.1 Pilar 1: Portal Público de Captación (`consiguetuvisa.com`)
* **Propósito**: Máxima velocidad de carga, SEO agresivo y conversión de prospectos fríos a leads calificados.
* **Capacidades**:
  1. **Arquitectura de Islas Resiliente**: Renderizado estático/SSR híbrido con Astro, Svelte 5 y Tailwind v4.
  2. **Tolerancia Total a Fallos**: Sistema `withSanityFallback` que garantiza renderizado al 100% ante cualquier caída o ausencia de datos en el CMS.
  3. **Agente IA de Calificación**: Asistente con Gemini y RAG embebido para resolver dudas migratorias 24/7 y derivar a WhatsApp.
  4. **Campañas Dinámicas**: Landings estacionales (Navidad, Black Friday, Urgentes) con cuenta regresiva y tracking UTM.

### 3.2 Pilar 2: Portal Privado de Membresías VIP (`/vip` o `/portal`)
* **Propósito**: Maximizar el valor de vida del cliente (LTV) ofreciendo servicios completos de Agencia de Viajes de Lujo.
* **Capacidades**:
  1. **Autenticación con RBAC**: Control de acceso granular vía Clerk (`role: "vip_member"`).
  2. **Bóveda de Viajero (Travel Vault)**: Almacenamiento seguro de pasaportes, formularios DS-160, itinerarios y pólizas de seguro de viaje.
  3. **Concierge de Viajes Integrado**: Chat directo con asesor personal para cotización de tickets aéreos, cruceros, hoteles y trenes.
  4. **Catálogo Exclusivo**: Ofertas de paquetes vacacionales con tarifas negociadas no disponibles al público general.

### 3.3 Pilar 3: Back-Office Operativo (`erp_worldclass_v2`)
* **Propósito**: Orquestación de la operación interna de la agencia con arquitectura SAP-like DDD.
* **Módulos Integrados**:
  * **`10_sd` (Sales & Distribution)**: Embudo de Leads, llamadas de seguimiento, agendamiento de citas en Google Calendar/Meet.
  * **`11_fico` (Finance & Controlling)**: Registro de cobros, dispersión de comisiones por venta de paquetes y balance de ingresos.
  * **`05_mdm` (Master Data Management)**: Ficha única de Business Partner (historial migratorio y preferencias de viaje).
  * **`07_hcm` & `09_eam`**: Asignación de asesores, turnos y control de inventario de chips/dispositivos de atención.

---

## 4. 🔐 Matriz de Roles y Permisos (RBAC)

| Rol | Acceso Front Público | Acceso Solicitud Visa | Acceso Portal VIP | Acceso Back-Office ERP |
| :--- | :---: | :---: | :---: | :---: |
| **`ANONYMOUS_GUEST`** | ✅ Lectura Total | ❌ Requiere Registro | ❌ Bloqueado | ❌ Bloqueado |
| **`VISA_APPLICANT`** | ✅ Sí | ✅ Su propio trámite | ⚠️ Vista previa / Upsell | ❌ Bloqueado |
| **`VIP_MEMBER`** | ✅ Sí | ✅ Su propio trámite | ✅ Acceso Total (Viajes) | ❌ Bloqueado |
| **`TRAVEL_ADVISOR`** | ✅ Sí | 👁️ Casos Asignados | 👁️ Clientes Asignados | ✅ Módulos SD / MDM |
| **`SYSTEM_ADMIN`** | ✅ Sí | ✅ Todos los casos | ✅ Panel Administrativo | ✅ Todos los módulos |

---

## 5. 📊 Métricas de Éxito (KPIs)

### KPIs de Negocio:
* **Tasa de Conversión Web**: $\ge 4.5\%$ (Visitante a Lead de Visa).
* **Tasa de Upsell a Membresía VIP**: $\ge 28\%$ (Cliente de Visa que adquiere paquete turístico o membresía).
* **Ratio LTV / CAC**: $\ge 5.2\times$ (Multiplicador de valor gracias al canal de viajes).

### KPIs Técnicos y de Ingeniería:
* **Core Web Vitals (LCP)**: $\le 1.2 \text{ segundos}$ en móvil y desktop.
* **Disponibilidad de Servicio (SLA)**: $99.95\%$ uptime (con respaldo automático por fallbacks locales).
* **Latencia de API**: $\le 120 \text{ ms}$ (en endpoints `/api/v1/*`).
* **Calidad de Código**: Cero vulnerabilidades críticas (verificadas con Snyk y reglas Pentest).

---

## 6. 🗺️ Roadmap de Entrega por Fases

```
Fase 1: Core Web & Fallbacks (COMPLETADA)
├── Blindaje Sanity CMS con withSanityFallback
├── Unificación del Design System en src/styles
└── Code splitting del bundle de Studio (22 kB)

Fase 2: Arquitectura de API v1 & Ambientes (EN CURSO)
├── Separación formal Testing vs Producción
├── Especificación y contratos de /api/v1/*
└── Creación del puente de sincronización con erp_worldclass_v2

Fase 3: Portal VIP & Módulo de Membresías
├── Rutas protegidas /portal con Clerk RBAC
├── Bóveda de documentos del viajero
└── Cotizador de vuelos y concierge de viajes

Fase 4: Auditoría de Seguridad & SEO
├── Pentesting de endpoints y middleware
└── Optimización exhaustiva de Schema Markup & OpenGraph
```
