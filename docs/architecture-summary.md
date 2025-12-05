# Resumen de Arquitectura y Stack Tecnológico

Este documento resume la arquitectura final, el stack tecnológico y las decisiones tomadas para el proyecto `consiguetuvisa.com`, con un enfoque en un entorno de desarrollo estable y un despliegue serverless en Vercel.

## 1. Visión General de la Arquitectura

El proyecto sigue una arquitectura **JAMstack desacoplada (headless)**:

-   **Frontend:** Gestionado por Astro para renderizado de alta performance.
-   **Backend:** Expuesto como una API serverless a través de Astro API Routes.
-   **Portabilidad:** La lógica de negocio está aislada, y la configuración de despliegue está centrada en Vercel.

## 2. Stack Tecnológico Probado

| Componente                | Tecnología Seleccionada        | Razón                                                                                                                                                             |
| ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework Web             | **Astro**                      | Framework principal para la UI y el enrutamiento de la API.                                                                                                       |
| Entorno de Despliegue     | **Vercel**                     | Plataforma de hosting serverless.                                                                                                                                 |
| Adaptador de Astro        | `@astrojs/vercel`              | Prepara el proyecto para un despliegue optimizado en Vercel, convirtiendo las rutas de API en Vercel Serverless Functions.                                        |
| Servidor GraphQL          | **`graphql.js` (Puro)**        | Implementación base de GraphQL. **Seleccionado por su estabilidad probada en el entorno de desarrollo local (`pnpm vercel-dev`) y para producción en Vercel**, donde `graphql-yoga` fallaba en el desarrollo. |
| ORM / Base de Datos       | **Prisma**                     | Herramienta para la interacción con la base de datos.                                                                                                             |
| Pruebas de Carga          | **k6**                         | Utilizado para verificar el rendimiento y la correcta funcionalidad del endpoint de la API.                                                                       |
| Gestor de Paquetes        | **pnpm**                       | Utilizado para la gestión de dependencias del proyecto.                                                                                                           |

## 3. Arquitectura Detallada

### Frontend
-   Las páginas, layouts y componentes de la interfaz de usuario se gestionan íntegramente dentro de la estructura de Astro (`src/pages`, `src/components`, etc.).
-   El frontend consume datos del backend a través de peticiones HTTP a su propia API (`/api/graphql`).

### Backend (API)
-   La API se construye usando **Astro API Routes**. Cada archivo en `src/pages/api/` se convierte en un endpoint serverless.
-   El endpoint principal de GraphQL reside en `src/pages/api/graphql.ts`.
-   **Implementación "A Ring Pelado":** Se utiliza la librería `graphql` directamente para procesar las peticiones. Esto implica:
    1.  Recibir la `Request` de Astro.
    2.  Extraer manualmente `query` y `variables` del cuerpo de la petición.
    3.  Usar la función `graphql()` para ejecutar la consulta contra el esquema.
    4.  Construir y retornar manualmente una `Response`.
-   **Lógica de Negocio Aislada:** El `schema` (`typeDefs`) y los `resolvers` se definen en `src/server/graphql/server.ts`, manteniendo la lógica de GraphQL separada del handler de la API. Los resolvers son el puente hacia los controladores y casos de uso en `src/server/lib/features/`.

### Justificación de la Decisión: `graphql.js` vs `graphql-yoga`
Durante la depuración, se encontró una **incompatibilidad fundamental entre `graphql-yoga` y el entorno de desarrollo local de Astro (impulsado por Vite)**. `graphql-yoga` provocaba un fallo silencioso que impedía que el endpoint de la API se cargara correctamente cuando se ejecutaba con `pnpm dev` o incluso `pnpm vercel-dev` cuando Astro intentaba procesar su módulo.

Aunque `graphql-yoga` es una librería excelente y compatible con Vercel en producción, su inestabilidad e imposibilidad de ejecución en el entorno de desarrollo local actual la hizo inviable para una experiencia de desarrollo fluida. Por ello, se optó por la implementación "a ring pelado" con `graphql.js` por las siguientes razones:
1.  **Funciona de manera estable y probada** en el entorno de desarrollo local (`pnpm vercel-dev`) y es compatible con el despliegue en Vercel.
2.  **Garantiza que lo que se desarrolla localmente funcionará en producción**, evitando sorpresas.
3.  **Es la máxima expresión de "anti-vendor lock-in"**, al depender únicamente de la especificación oficial de GraphQL y no de un servidor de conveniencia específico.

La desventaja es la pérdida de comodidades como GraphiQL integrado, que pueden ser añadidas manualmente si se requiere en el futuro.

## 4. Entorno de Desarrollo y Pruebas

Debido a una incompatibilidad entre el servidor de desarrollo nativo de Astro (`astro dev`) y la forma en que se deben ejecutar las rutas API para un entorno serverless, se ha determinado que el único entorno de desarrollo local estable es el proporcionado por la **CLI de Vercel**.

-   **Comando para desarrollar:** `pnpm vercel-dev`
-   **URL del Frontend:** `http://localhost:3000/`
-   **URL del Endpoint GraphQL:** `http://localhost:3000/api/graphql`
-   **Comando para pruebas de carga:** `k6 run tests-performance/load_test_graphql.js`

El uso de `pnpm dev` (`astro dev`) **NO FUNCIONARÁ** para probar los endpoints de la API.

Este setup ha sido verificado y es la base recomendada para continuar el desarrollo del proyecto.
