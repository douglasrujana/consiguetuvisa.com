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

### 2.2 `erp_worldclass_v2` en Modo SaaS Headless → Turso Multi-DB por Tenant

Turso soporta de forma nativa el patrón de **una base de datos libSQL por tenant**, que otorga aislamiento físico completo de datos sin la complejidad operativa del Multi-Schema de PostgreSQL:

```bash
# Onboarding de nuevo cliente del ERP en segundos:
turso db fork erp_base_schema --name tenant_farmacia_central_ec
turso db fork erp_base_schema --name tenant_clinica_salud_q
```

* Cada empresa cliente obtiene una base de datos libSQL aislada al 100%.
* Las migraciones de schema se propagan mediante `prisma migrate deploy` apuntando al `DATABASE_URL` del tenant correspondiente.

### 2.3 `erp_worldclass_v2` en Modo In-Situ Enterprise → PostgreSQL (Neon / Supabase)

Cuando un cliente corporativo requiere:
* Instalación física en servidores propios o cloud privada.
* Compliance regulatorio (HIPAA para clínicas, SOC2, GDPR).
* Integraciones con herramientas empresariales que requieren PostgreSQL nativo (Power BI, SAP, Oracle).

En ese caso y **solo en ese caso**, el ERP se despliega sobre **PostgreSQL** (Neon Serverless o Supabase Self-Hosted). El motor del ERP es agnóstico al proveedor gracias a Prisma ORM.

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
