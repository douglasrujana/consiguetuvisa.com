# ADR-005: Headless Multi-Tenant ERP con Dual Authentication Mode

| Metadato | Valor |
| :--- | :--- |
| **Estado** | **Aceptado / En Diseño de Implementación** |
| **Fecha** | Agosto 2026 |
| **Fase SDLC** | `03_architecture/adrs` |
| **Contexto** | Estrategia de Integración entre `consiguetuvisa.com` y `erp_worldclass_v2`, Comercialización SaaS y Modos de Autenticación |

---

## 1. Contexto y Problema
El ERP `erp_worldclass_v2` fue construido originalmente en el contexto de la agencia de visas. Sin embargo, su arquitectura interna con nomenclatura SAP-like (`10_sd`, `11_fico`, `05_mdm`, `07_hcm`) es completamente agnóstica a cualquier industria.

El problema central a resolver:
1. **No acoplar el ERP a la palabra "visa"**: Debe poder venderse e instalarse en una farmacia, clínica, ferretería o cualquier empresa de servicios sin modificar el motor interno.
2. **No acoplar el Auth del ERP al Auth del Frontend**: El ERP tiene sus propios usuarios operativos (asesores, cajeros, médicos, administradores). El Frontend tiene sus propios clientes (viajeros, pacientes, compradores).
3. **Mantener la soberanía de datos**: Los datos de `Empresa_A` nunca deben mezclarse con los de `Empresa_B` en el mismo motor de base de datos.

---

## 2. Decisión de Arquitectura

### 2.1 Dos Modos de Operación del ERP (Dual Mode):

#### Modo 1: STANDALONE (In-situ o Cloud Dedicada)
* El ERP corre de forma autónoma sin ninguna dependencia de `consiguetuvisa.com`.
* Tiene su propia interfaz de usuario (`00_portal` / Launchpad) accesible directamente.
* Gestiona su propio sistema de autenticación interno (`01_infra/security/INFRA_AuthGuard.js`) para usuarios operativos (cajeros, bodegueros, médicos, asesores).
* **Casos de uso**: Farmacia que compra licencia del ERP para gestión de inventario y ventas; clínica que lo usa para agendar citas médicas y controlar nómina de personal.

#### Modo 2: HEADLESS (Backend Silencioso con Integración API)
* El ERP corre como motor de negocio silencioso detrás de un frontend externo (`consiguetuvisa.com`, App Móvil, Portal de otra empresa).
* Expone una **API REST abierta y versionada** (`POST /v1/partners`, `POST /v1/orders`, `POST /v1/appointments`) que cualquier frontend puede consumir.
* El frontend externo gestiona la autenticación de sus propios usuarios finales (con Clerk, Better-Auth, Supabase Auth, o cualquier proveedor).
* La comunicación Frontend → ERP se realiza mediante **Machine-to-Machine (M2M)** con credenciales de servicio:

```http
POST https://erp.worldclass.app/v1/orders
Authorization: Bearer ERP_SERVICE_API_KEY_CONSIGUETUVISA
X-Tenant-ID: consiguetuvisa_ec
X-Customer-ID: user_clerk_12345
Content-Type: application/json
```

### 2.2 Multi-Tenancy: Cada empresa en su propio esquema
* El ERP distingue cada empresa cliente mediante `X-Tenant-ID` en los headers de la API.
* Cada `tenantId` corresponde a un esquema PostgreSQL aislado (ver ADR-004).
* Cuando se onboardea un nuevo cliente, una migración automática crea el esquema `tenant_{id}` y aplica el DDL estándar del ERP sin necesidad de desplegar nueva infraestructura.

### 2.3 Regla de Autenticación Dual:

| Actor | Modo | Sistema de Auth | Cómo accede |
| :--- | :---: | :--- | :--- |
| **Cliente Final (Viajero, Paciente)** | Headless | Clerk / Better-Auth (del Frontend) | Entra a `consiguetuvisa.com/portal` |
| **Asesor / Cajero / Doctor** | Standalone o Headless | Auth interno del ERP (`INFRA_AuthGuard`) | Entra al Launchpad del ERP directamente |
| **Servicio Backend (Frontend → ERP)** | Headless | API Key M2M + X-Tenant-ID | Llamada server-side, nunca expuesta al browser |

---

## 3. Consecuencias

### Positivas:
* **Comercialización SaaS Pura**: El ERP puede licenciarse a cualquier empresa con un onboarding de minutos (crear `tenantId` + migrar esquema + emitir API Key).
* **Independencia Tecnológica Total**: El ERP no tiene ningún acoplamiento al stack de `consiguetuvisa.com`. Si el frontend migra de Astro a Next.js o a una App Flutter, el ERP no requiere ningún cambio.
* **Seguridad M2M**: Las API Keys de servicio nunca viajan al navegador del usuario final; la comunicación ocurre en el servidor de Vercel con credenciales en variables de entorno.

### Neutrales / Trade-offs:
* Requiere mantener documentación viva del contrato OpenAPI del ERP para que los frontends externos puedan integrarse correctamente.
* Los datos de un cliente del ERP (ej. historial de un asesor de la agencia) viven en el esquema del ERP y no en la base de datos de la web, lo que requiere consultas federadas o eventos webhook para sincronizar vistas en el frontend.
