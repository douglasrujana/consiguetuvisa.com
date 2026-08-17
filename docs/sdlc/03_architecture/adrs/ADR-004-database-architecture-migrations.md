# ADR-004: Arquitectura de Base de Datos PostgreSQL, Multi-Tenancy y Estrategia de Migraciones

| Metadato | Valor |
| :--- | :--- |
| **Estado** | **Aceptado / Regla de Oro de Ingeniería** |
| **Fecha** | Agosto 2026 |
| **Fase SDLC** | `03_architecture/adrs` |
| **Contexto** | Base de Datos Relacional, Esquemas Multi-Tenant, Migraciones Prisma y Capa de Caché |

---

## 1. Contexto y Problema
El ecosistema digital comprende dos componentes con naturalezas de persistencia distintas:
1. **Front-Office (`consiguetuvisa.com`)**: Requiere persistencia ágil de sesiones, captura de leads, banners dinámicos, registros de auditoría y métricas del sitio web.
2. **Back-Office Core ERP (`erp_worldclass_v2`)**: Requiere un modelo empresarial robusto (MDM, SD, FICO, MM, HCM) capaz de operar como solución SaaS multi-empresa (agencias de viajes, farmacias, clínicas, ferreterías) o standalone in-situ.

Mantener SQLite/Turso para producción de gran escala presenta limitaciones para multi-tenancy formal, esquemas aislados y tipado avanzado (JSONB, índices GIN, transacciones ACID distribuidas).

---

## 2. Decisión de Arquitectura

### 2.1 Motor de Base de Datos: PostgreSQL Serverless (Neon / Supabase)
Se estandariza **PostgreSQL** como el motor relacional principal del ecosistema:
* **Neon Serverless Postgres** como proveedor principal por su soporte nativo de **Instant Branching** (permite clonar esquemas y datos instantáneamente para `testing.consiguetuvisa.com`) y connection pooling optimizado para Vercel Serverless.
* **Supabase PostgreSQL** como alternativa compatible gracias a la capa de abstracción de Prisma.

### 2.2 Estrategia de Aislamiento Multi-Tenant: Multi-Schema PostgreSQL
Para garantizar el principio de **"juntos pero no revueltos"** y evitar fugas de datos entre empresas cliente del ERP:
* Se rechaza el modelo de "todo en una tabla compartida con `tenantId`" por riesgo de seguridad.
* Se adopta el modelo **Multi-Schema**: cada empresa cliente tiene su propio esquema lógico aislado dentro de PostgreSQL (`schema "tenant_consiguetuvisa"`, `schema "tenant_farmacia_central"`, `schema "tenant_clinica"`).
* Los datos de una empresa jamás coexisten en las mismas tablas físicas que otra empresa.

### 2.3 Estrategia de Migraciones con Prisma ORM
La configuración del datasource en `schema.prisma` adopta el estándar de doble URL (Pooling para serverless + Direct para migraciones):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Conexión con pooling (PgBouncer / Neon Pooling)
  directUrl = env("DIRECT_URL")     // Conexión directa TCP para migraciones
}
```

* **Flujo Local (Desarrollo)**: `npx prisma migrate dev --name <nombre_migracion>`
* **Flujo CI/CD (Testing / Producción)**: `npx prisma migrate deploy` (ejecución determinista de SQL sin bloqueo interactivo).

### 2.4 Estrategia de Caché en 2 Capas
1. **Capa L1 (En Memoria / Runtime SWR)**: Implementada mediante el wrapper `withSWR` para datos de CMS y configuraciones globales (latencia $0\text{ ms}$).
2. **Capa L2 (Distribuida Serverless)**: **Upstash Redis** mediante REST API para invalidación global de sesiones, rate-limiting de API y respuestas de cotizaciones frecuentes (latencia $<10\text{ ms}$).

---

## 3. Consecuencias

### Positivas:
* **Aislamiento Seguro de Datos**: Cada cliente del ERP opera en un esquema hermético con posibilidad de exportar copias de seguridad individuales (`pg_dump -n <schema_name>`).
* **Branching para Pruebas**: Crear entornos de testing (`testing.consiguetuvisa.com`) toma segundos mediante ramas de base de datos de Neon sin afectar los datos de producción.
* **Cero Concurrency Bottlenecks**: El pooling nativo previene el agotamiento de conexiones en entornos serverless de alto tráfico.

### Neutrales / Trade-offs:
* Requiere aprovisionar `DATABASE_URL` y `DIRECT_URL` en las variables de entorno de Vercel y locales.
