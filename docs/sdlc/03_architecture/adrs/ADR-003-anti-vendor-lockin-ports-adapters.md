# ADR-003: Principio Anti Vendor-Locking mediante Puertos y Adaptadores (Hexagonal Architecture)

| Metadato | Valor |
| :--- | :--- |
| **Estado** | **Aceptado / Regla de Oro de Ingeniería** |
| **Fecha** | Agosto 2026 |
| **Fase SDLC** | `03_architecture/adrs` |
| **Contexto** | Autenticación, CMS, Base de Datos y Pasarelas de Pago |

---

## 1. Contexto y Problema
El uso de servicios de terceros (ej. Clerk para autenticación, Sanity para CMS, Vercel para hosting, Turso para base de datos) acelera el desarrollo inicial. Sin embargo, acoplar directamente los SDKs de estos proveedores dentro de las entidades de negocio, controladores o componentes de interfaz genera **Vendor Lock-in**:
* Incremento arbitrario de costos de suscripción del proveedor sin posibilidad de migración.
* Imposibilidad de desplegar la solución en ambientes on-premise / in-situ (ej. ERP para clínicas o farmacias privadas).
* Dependencia crítica de la estabilidad y políticas de terceros.

---

## 2. Decisión de Arquitectura
Se establece formalmente que **ningún módulo de negocio, caso de uso, controlador o componente UI puede importar directamente SDKs de terceros**. 

Toda interacción con servicios externos debe regirse por el patrón **Puertos y Adaptadores (Arquitectura Hexagonal)**:

### 2.1 Especificación del Puerto de Autenticación (`IAuthProvider`):
Cualquier proveedor de autenticación (Clerk, Better-Auth, Lucia, Firebase, Supabase Auth o LDAP in-situ) debe implementar el contrato estándar [`Auth.port.ts`](../../../src/server/lib/features/auth/Auth.port.ts):

```typescript
export interface IAuthProvider {
  validateToken(token: string): Promise<TokenValidationResult>;
  getUserFromRequest(request: Request): Promise<AuthUser | null>;
  getUserById(userId: string): Promise<AuthUser | null>;
  signOut(sessionId: string): Promise<boolean>;
  isAuthenticated(request: Request): Promise<boolean>;
}
```

### 2.2 Inversión de Dependencias (DI Container):
La instanciación del proveedor se realiza exclusivamente en el contenedor de dependencias (`ContextFactory.ts`). Para reemplazar Clerk por Better-Auth o un proveedor propio:
1. Se implementa `BetterAuthProvider implements IAuthProvider`.
2. Se conmuta la inyección en `ContextFactory.ts`.
3. **El resto del sistema (APIs, base de datos, ERP, frontend) permanece 100% inalterado.**

---

## 3. Consecuencias

### Positivas:
* **Libertad Total**: El software puede migrar de proveedor de Auth, CMS o Base de Datos en horas sin refactorizar la lógica de negocio.
* **Compatibilidad Multi-Entorno**: Permite operar tanto en modo SaaS / Cloud (con Clerk / Sanity) como en modo On-Premise / Standalone (con Better-Auth / SQLite local).
* **Testabilidad**: Permite crear `MockAuthProvider` y `MockCmsProvider` para tests unitarios y de integración sin depender de conexiones a internet ni tokens de API reales.

### Neutrales / Trade-offs:
* Requiere escribir una capa de adaptación (Adapter) que traduzca los objetos del proveedor a las entidades de dominio del sistema (`AuthUser`, `TokenValidationResult`).
