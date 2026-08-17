# ADR-002: Arquitectura Hexagonal (Clean Architecture) con DDD en el Core del Sistema

| Metadato | Valor |
| :--- | :--- |
| **Estado** | **Aceptado / En Producción** |
| **Fecha** | Agosto 2026 |
| **Fase SDLC** | `03_architecture/adrs` |
| **Contexto** | Organización del Código de Servidor, Lógica de Negocio y Separación de Responsabilidades |

---

## 1. Contexto y Problema
Un proyecto de esta escala (sitio público + ERP + portal VIP + múltiples integraciones externas) corre el riesgo de convertirse en un "Big Ball of Mud": lógica de negocio mezclada con código de infraestructura, frameworks de UI acoplados a consultas directas de base de datos y llamadas a APIs externas dispersas por toda la aplicación.

Los síntomas concretos que se querían prevenir:
* Llamadas directas a `@sanity/client` o `prisma` desde dentro de componentes `.astro` o `.svelte`.
* Lógica de validación de negocio duplicada en múltiples endpoints de API.
* Imposibilidad de testear la lógica de negocio sin levantar un servidor completo ni conectarse a APIs externas reales.

---

## 2. Decisión de Arquitectura

Se adopta **Arquitectura Hexagonal (Ports & Adapters)** combinada con principios de **Domain-Driven Design (DDD)** para el código del servidor (`src/server/`).

### 2.1 Estructura de Capas del Directorio `src/server/lib/`:

```
src/server/lib/
├── core/           # 🧠 Configuración del sistema, DI Container, errores globales
├── ports/          # 🔌 Interfaces/Contratos (IAuthProvider, ICmsPort, IDataRepository)
├── features/       # 🎯 DOMINIO PURO — Casos de uso, Entidades, DTOs, Validadores
│   ├── auth/       # (Auth.entity.ts, Auth.port.ts, Auth.service.ts...)
│   ├── leads/
│   ├── solicitud/
│   ├── asesoria/
│   └── ...         # 12 módulos de negocio 100% agnósticos a frameworks
└── adapters/       # 🔧 Implementaciones concretas (SanityAdapter, PrismaAdapter...)
```

### 2.2 La Regla de Oro de Dependencias (Dependency Rule):
Las dependencias de importación solo pueden apuntar **hacia adentro** (hacia el dominio). El dominio no importa nada de la capa de adaptadores ni de frameworks externos:

```
[ UI / Astro Pages ]
        ↓
[ API Endpoints /api/* ]
        ↓
[ Features / Use Cases ]  ← El dominio vive aquí. No conoce nada exterior.
        ↓
[ Ports (Interfaces) ]
        ↑
[ Adapters: Sanity, Prisma, Clerk, Drive... ]  ← Implementan los puertos
```

### 2.3 Estructura Interna de un Módulo de Dominio (Ejemplo: `leads`):

| Archivo | Responsabilidad |
| :--- | :--- |
| `Lead.entity.ts` | Clase del dominio con lógica de negocio pura (validaciones, invariantes). |
| `Lead.dto.ts` | Objeto de Transferencia de Datos para entrada/salida de la API. |
| `Lead.port.ts` | Interfaz `ILeadRepository` que define el contrato de persistencia. |
| `Lead.usecases.ts` | Orquesta la lógica: valida, aplica reglas de negocio, llama al repositorio. |
| `Lead.repository.ts` | Implementación concreta con Prisma (un adaptador del puerto). |
| `Lead.validator.ts` | Reglas de validación de datos de entrada (independientes del HTTP). |

---

## 3. Consecuencias

### Positivas:
* **Testabilidad Total**: Los casos de uso pueden probarse con `MockLeadRepository` sin tocar Prisma ni ningún servicio externo.
* **Intercambiabilidad de Infraestructura**: Cambiar de Prisma a Drizzle, o de SQLite a PostgreSQL, requiere reescribir únicamente el archivo `repository.ts` sin alterar la lógica de negocio.
* **Coherencia Multi-Proyecto**: El mismo patrón de módulos aplica al `erp_worldclass_v2`, garantizando que los desarrolladores puedan moverse entre proyectos sin fricción conceptual.
* **Onboarding Rápido**: Cualquier nuevo desarrollador puede localizar exactamente dónde vive cada tipo de lógica siguiendo la convención de nomenclatura `Módulo_Capa.ts`.
