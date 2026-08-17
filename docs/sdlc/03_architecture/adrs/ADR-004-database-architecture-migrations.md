# ADR-004: Estrategia de Base de Datos — Turso/libSQL para Edge, PostgreSQL para In-Situ Enterprise

| Metadato | Valor |
| :--- | :--- |
| **Estado** | **Aceptado / Revisado — Agosto 2026** |
| **Fecha de Revisión** | Agosto 2026 |
| **Fase SDLC** | `03_architecture/adrs` |
| **Contexto** | Base de Datos Relacional, Multi-Tenancy, Migraciones Prisma y Capa de Caché |

---

## 1. Contexto y Decisión Actualizada

### 1.1 El Principio de Decisión: "No Rompas lo que Funciona"
`consiguetuvisa.com` ya tiene clientes en producción corriendo sobre **Turso (libSQL)**. Forzar una migración a PostgreSQL para satisfacer un requisito arquitectónico teórico cuando Turso resuelve el problema real no es ingeniería, es sobreingeniería.

Se adopta el principio: **la base de datos correcta es la que sirve al caso de uso real, no la que está de moda**.

---

## 2. Decisión de Arquitectura por Componente

### 2.1 `consiguetuvisa.com` → Turso (libSQL / Edge) — Permanente

**Turso no es un SQLite de desarrollo. Es libSQL distribuido globalmente en el Edge.**

| Capacidad | Turso (libSQL) |
| :--- | :--- |
| **Latencia de lectura global** | ~6ms desde CDN Edge (inferior solo a caché L1) |
| **Compatibilidad con Prisma ORM** | ✅ Nativa via `@prisma/adapter-libsql` |
| **Branching para ambientes** | ✅ `turso db fork <db> --name <env>` (igual que Neon Postgres) |
| **Bases de datos por cuenta** | Ilimitadas (perfecto para multi-tenancy) |
| **Réplicas por región** | Automáticas (distribución global sin configuración extra) |
| **Clientes en producción activos** | ✅ Migración innecesaria y contraproducente |

**Conclusión**: La base de datos de `consiguetuvisa.com` **permanece en Turso sin modificación**. El escalamiento horizontal se activa automáticamente cuando el volumen lo exija mediante réplicas regionales de Turso.

### 2.2 `erp_worldclass_v2` → PostgreSQL (Neon Serverless) — Siempre, sin excepción

El ERP no usa Turso. Opera sobre **PostgreSQL en Neon Serverless** en todos sus modos de despliegue:

| Modo de Despliegue | Base de Datos | Razón |
| :--- | :--- | :--- |
| **SaaS Headless** (agencias, farmacias, clínicas) | PostgreSQL Neon | Multi-Schema por tenant, migraciones formales, ACID |
| **In-Situ Enterprise** (servidores propios) | PostgreSQL Neon Self-Hosted o Supabase | Compliance, acceso físico y control total |

**¿Por qué PostgreSQL y no Turso para el ERP?**
* El ERP maneja transacciones contables (`11_fico`), inventario (`08_mm`) y nómina (`07_hcm`): dominios donde las **transacciones ACID multi-tabla** y los **constraints relacionales** de PostgreSQL son no negociables.
* PostgreSQL soporta **Multi-Schema nativo**: cada empresa cliente del ERP recibe su propio esquema aislado (`schema "tenant_consiguetuvisa"`, `schema "tenant_farmacia_central"`) dentro de una misma instancia Neon, con backups independientes por schema.
* **Neon Instant Branching**: permite clonar el esquema completo de producción del ERP en segundos para crear ambientes de testing sin duplicar infraestructura.

```bash
# Onboarding de nuevo cliente en el ERP (segundos):
# Se crea el schema del tenant y se aplican migraciones
psql $NEON_URL -c "CREATE SCHEMA tenant_farmacia_central;"
npx prisma migrate deploy --schema=tenant_farmacia_central
```

### 2.3 Separación Estricta: La Web Nunca Toca la DB del ERP y Viceversa

```
consiguetuvisa.com  ←──→  Turso/libSQL (Edge)
                               ↕ (ninguna conexión directa)
erp_worldclass_v2   ←──→  PostgreSQL / Neon Serverless
```

La comunicación entre ambos sistemas ocurre **únicamente vía API REST + Webhooks** (ver ADR-005). Jamás mediante consultas directas entre bases de datos.

---

## 3. Estrategia de Migraciones

```prisma
// schema.prisma — Configuración universal compatible con Turso y PostgreSQL
datasource db {
  provider = "sqlite"   // Para Turso/libSQL (cambia a "postgresql" para in-situ enterprise)
  url      = env("DATABASE_URL")
}
```

* **Entorno de desarrollo**: `npx prisma migrate dev --name <nombre>`
* **Testing / Staging**: `turso db fork <prod-db> --name <staging-db>` + `npx prisma migrate deploy`
* **Producción**: `npx prisma migrate deploy` en CI/CD (Vercel Build Hook o GitHub Actions)

---

## 4. Estrategia de Caché en 2 Capas

1. **Capa L1 (Runtime SWR — En Memoria)**: Wrapper `withSWR` ya implementado. Latencia: **0ms** para datos CMS y configuraciones globales.
2. **Capa L2 (Distribuida Serverless — Upstash Redis)**: Se implementará cuando el volumen de la API lo requiera para rate-limiting, invalidación de sesiones y respuestas de cotizaciones frecuentes. Latencia: **<10ms**.

**Principio**: La Capa L2 se añade cuando el profiler identifique cuellos de botella reales. No se implementa anticipatoriamente.

---

## 5. Consecuencias

### Positivas:
* **Continuidad de Servicio**: Los clientes actuales de `consiguetuvisa.com` no experimentan ninguna interrupción ni migración.
* **Aislamiento Multi-Tenant Real**: Cada empresa cliente del ERP tiene su propia base de datos Turso — aislamiento físico sin complejidad de Multi-Schema Postgres.
* **Flexibilidad**: El mismo motor del ERP puede correr sobre Turso (SaaS) o PostgreSQL (Enterprise in-situ) sin cambios en el código de negocio.

### Neutrales / Trade-offs:
* SQLite/libSQL no soporta algunas extensiones avanzadas de PostgreSQL (ej. `pg_vector` para embeddings de IA). Si el ERP requiere búsqueda vectorial en el futuro, se añade un servicio externo (Pinecone, Qdrant) o se evalúa migración del módulo de IA a Supabase pgvector.
